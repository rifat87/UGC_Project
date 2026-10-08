# main.py — ESP32 + R307 detect/cls with LEDs and post-capture memory cleanup.
# detect: asks person_id, captures thumb & index (SAMPLES_PER_FINGER images), saves as {pid}_{finger}_{n}.png
# cls   : no person_id, sends one image per placement; requests identification JSON

import network, time, gc, sys, uselect, usocket, ujson, re
from machine import UART, Pin
from pyfingerprint import PyFingerprint

# ====== CONFIG ======
SSID, PASSWORD = 'NMARS', '1112131415'
HOST, PORT, PATH = '192.168.43.134', 3000, '/upload-image'   # PC running Express
BAUD, UART_TX, UART_RX = 57600, 17, 16
W, H = 256, 288
PACKED_LEN = (W * H) // 2
SENSOR_ADDRESS = 0xFFFFFFFF

# Enrollment plan
FINGERS = ["thumb", "index"]     # order shown to operator
SAMPLES_PER_FINGER = 2

QUIET_MS = 800

# ====== LED PINS (adjust if needed) ======
GREEN_LED_PIN = 12
RED_LED_PIN   = 13
# If your LEDs are active-LOW, invert the .value(1/0) pairs in helpers below.

ledG = Pin(GREEN_LED_PIN, Pin.OUT); ledR = Pin(RED_LED_PIN, Pin.OUT)

def leds_off():
    ledG.value(0); ledR.value(0)

def led_ready():          # ready to take a finger
    ledG.value(1); ledR.value(0)

def led_capture_active(): # finger placed / capturing / sending
    leds_off()

def led_success():        # post-capture success indication
    ledG.value(1); ledR.value(0)

def led_failure():        # post-capture failure indication
    ledG.value(0); ledR.value(1)

# Optional: proactive GC
try:
    gc.collect()
    if hasattr(gc, "threshold"):
        gc.threshold(gc.mem_free() // 4 + gc.mem_alloc())
except Exception:
    pass

cls_counter = 1

# ====== Wi-Fi ======
def wifi_connect():
    wlan = network.WLAN(network.STA_IF); wlan.active(True)
    if not wlan.isconnected():
        print("Connecting to Wi-Fi…", end='')
        wlan.connect(SSID, PASSWORD)
        t0 = time.time()
        while not wlan.isconnected() and (time.time()-t0) < 20:
            print('.', end=''); time.sleep(0.4)
        print()
    if not wlan.isconnected(): raise RuntimeError("Wi-Fi failed")
    print("✔ Wi-Fi:", wlan.ifconfig()[0])

# ====== Minimal FPM packets over UART ======
STARTCODE = 0xEF01
PACKET_COMMAND, PACKET_ACK = 0x01, 0x07
PACKET_DATA, PACKET_DATA_END = 0x02, 0x08
CMD_DOWNLOADIMAGE = 0x0A

def _be16(n): return bytes([(n>>8)&0xFF, n&0xFF])

def _write_packet(uart, address, ptype, payload_bytes):
    plen = len(payload_bytes) + 2
    hdr  = _be16(STARTCODE) + address.to_bytes(4,'big') + bytes([ptype]) + _be16(plen)
    cs   = (ptype + hdr[-2] + hdr[-1] + sum(payload_bytes)) & 0xFFFF
    uart.write(hdr + payload_bytes + _be16(cs))

def _read_exact(uart, n, timeout_ms=3000):
    buf = bytearray(); t0=time.ticks_ms()
    while len(buf) < n:
        chunk = uart.read(n - len(buf))
        if chunk: buf.extend(chunk)
        else:
            if time.ticks_diff(time.ticks_ms(), t0) > timeout_ms: return None
            time.sleep_ms(1)
    return bytes(buf)

def _read_packet(uart, timeout_ms=5000):
    hdr = _read_exact(uart, 9, timeout_ms)
    if not hdr: raise Exception("timeout header")
    if hdr[0] != (STARTCODE>>8) or hdr[1] != (STARTCODE&0xFF): raise Exception("bad startcode")
    ptype = hdr[6]
    plen  = (hdr[7]<<8) | hdr[8]
    rest  = _read_exact(uart, plen, timeout_ms)
    if not rest: raise Exception("timeout body")
    payload = rest[:-2]
    rxcs = (rest[-2]<<8) | rest[-1]
    calc = (ptype + hdr[7] + hdr[8] + sum(payload)) & 0xFFFF
    if rxcs != calc: raise Exception("bad checksum")
    return ptype, payload

# ====== Finger helpers ======
def ensure_idle(f, quiet_ms=QUIET_MS):
    start=None
    while True:
        if not f.readImage():
            if start is None: start=time.ticks_ms()
            if time.ticks_diff(time.ticks_ms(), start) >= quiet_ms: break
            time.sleep_ms(120)
        else:
            start=None; time.sleep_ms(150)

def wait_for_finger(f, poll_cmd=None):
    # Show READY state while we wait
    led_ready()
    print("Place finger…")
    ensure_idle(f)
    while not f.readImage():
        if poll_cmd:
            c = poll_cmd()
            if c in ('stop', 'quit', 'exit'): return ('abort', c)
        time.sleep_ms(80)
    print("✔ Captured")
    # During capture/transfer: ALL OFF
    led_capture_active()
    return ('ok', None)

def wait_for_lift(f, timeout_ms=7000):
    print("Remove finger…")
    t0=time.ticks_ms()
    while True:
        if not f.readImage(): print("✔ Finger removed"); break
        if time.ticks_diff(time.ticks_ms(), t0) > timeout_ms:
            print("⚠ Timeout"); break
        time.sleep_ms(150)

def flush_uart(uart):
    try:
        while uart.any(): uart.read()
    except Exception:
        pass

# ====== HTTP helpers (stream upload + read response) ======
def http_post_start(host, port, path, body_len, headers_dict):
    s = usocket.socket()
    ai = usocket.getaddrinfo(host, port, 0, usocket.SOCK_STREAM)[0][-1]
    s.connect(ai)
    lines = [
        "POST {} HTTP/1.1".format(path),
        "Host: {}:{}".format(host, port),
        "Content-Type: application/octet-stream",
        "Content-Length: {}".format(body_len),
        "Connection: close",
    ]
    for k,v in headers_dict.items():
        lines.append("{}: {}".format(k, v))
    lines.append(""); lines.append("")
    s.send("\r\n".join(lines).encode())
    return s

def http_read_response(sock, header_timeout_s=5, body_timeout_s=10):
    sock.settimeout(header_timeout_s)
    header_buf = b""
    while b"\r\n\r\n" not in header_buf:
        chunk = sock.recv(256)
        if not chunk: break
        header_buf += chunk
        if len(header_buf) > 8192: break
    parts = header_buf.split(b"\r\n\r\n", 1)
    if len(parts) == 1:
        head = header_buf; body = b""
    else:
        head, body = parts[0], parts[1]
    head_str = head.decode("iso-8859-1", "ignore")
    first_line = head_str.split("\r\n", 1)[0]
    try:
        status_code = int(first_line.split(" ")[1])
    except Exception:
        status_code = 0
    clen = None
    for line in head_str.split("\r\n"):
        if line.lower().startswith("content-length:"):
            try: clen = int(line.split(":",1)[1].strip())
            except: clen = None
            break
    if clen is not None:
        remaining = clen - len(body)
        sock.settimeout(body_timeout_s)
        while remaining > 0:
            chunk = sock.recv(min(1024, remaining))
            if not chunk: break
            body += chunk
            remaining -= len(chunk)
    else:
        sock.settimeout(body_timeout_s)
        while True:
            chunk = sock.recv(512)
            if not chunk: break
            body += chunk
    try: sock.close()
    except: pass
    return status_code, head_str, body

def stream_upimage_to_http(uart, address, sock):
    _write_packet(uart, address, PACKET_COMMAND, bytes([CMD_DOWNLOADIMAGE]))
    ptype, payload = _read_packet(uart)
    if ptype != PACKET_ACK or not payload or payload[0] != 0x00:
        code = payload[0] if payload else -1
        raise Exception("UpImage NACK code=%02X" % code)
    sent = 0
    while True:
        ptype, payload = _read_packet(uart, timeout_ms=5000)
        if ptype not in (PACKET_DATA, PACKET_DATA_END):
            raise Exception("unexpected packet %02X" % ptype)
        sock.send(payload)
        sent += len(payload)
        if ptype == PACKET_DATA_END:
            break
    return sent

# ====== Console (non-blocking) ======
poll = uselect.poll(); poll.register(sys.stdin, uselect.POLLIN)
def read_cmd_nb():
    try:
        if poll.poll(0):
            line = sys.stdin.readline()
            if line: return line.strip().lower()
    except Exception:
        pass
    return None

def ask_person_id():
    while True:
        try:
            pid = int(input("person_id (int): ").strip())
            return pid
        except Exception:
            print("Invalid person_id. Please enter an integer.")

# ====== POST-CAPTURE CLEANUP ======
def clear_after_cycle(uart, f, extra_objs=None):
    """Aggressively clear RAM and buffers between captures."""
    try:
        flush_uart(uart)
    except Exception:
        pass
    if extra_objs:
        for obj in extra_objs:
            try:
                if obj is None: continue
                del obj
            except Exception:
                pass
    try:
        gc.collect()
        time.sleep_ms(10)
        gc.collect()
    except Exception:
        pass
    try:
        ensure_idle(f)
    except Exception:
        pass
    time.sleep_ms(30)
    # NOTE: Do NOT set led_ready() here — we keep the result LED on.
    # The next wait_for_finger() will set green for "ready".

# ====== JSON Command Helpers ======
def send_json(obj):
    try:
        print(ujson.dumps(obj))
    except Exception as e:
        print(ujson.dumps({"status": "error", "message": str(e)}))


# ====== Modes ======
def detect_mode(uart, f, person_id):
    print("ENROLL mode: person_id={} — capture THUMB and INDEX, {} images each.".format(person_id, SAMPLES_PER_FINGER))

    for finger in FINGERS:
        print("\n--- Now capturing {} finger ---".format(finger))
        for sample_num in range(1, SAMPLES_PER_FINGER + 1):
            status, cmd = wait_for_finger(f)
            if status == 'abort':
                send_json({"status": "error", "action": "enroll", "nid": person_id, "message": "aborted"})
                return

            headers = {
                "X-Format": "packed4",
                "X-Width":  str(W),
                "X-Height": str(H),
                "X-Person-Id": str(person_id),
                "X-Mode": "enroll",
                "X-Filename": "{}_{}_{}".format(person_id, finger, sample_num),
                "X-Identify": "0",
            }
            sock = head_str = body = None
            try:
                sock = http_post_start(HOST, PORT, PATH, PACKED_LEN, headers)
                sent = stream_upimage_to_http(uart, SENSOR_ADDRESS, sock)
                status_code, head_str, body = http_read_response(sock)
                if 200 <= status_code < 300:
                    led_success()
                else:
                    led_failure()
                print("Saved {} ({} bytes)".format(headers["X-Filename"], sent))
            except Exception as e:
                led_failure()
                send_json({"status": "error", "action": "enroll", "nid": person_id, "message": str(e)})

            wait_for_lift(f)
            clear_after_cycle(uart, f, extra_objs=[sock, head_str, body])

    send_json({"status": "success", "action": "enroll", "nid": person_id})

# Single shot detect instead of detectiong(cls)

def detect_single(uart, f):
    print("DETECT mode (single shot)")
    status, cmd = wait_for_finger(f)
    if status == 'abort':
        send_json({"status": "error", "action": "detect", "message": "aborted"})
        return

    headers = {
        "X-Format": "packed4",
        "X-Width":  str(W),
        "X-Height": str(H),
        "X-Mode": "detect",
        "X-Identify": "1",
        "X-Filename": "detect_img_1"
    }
    sock = head_str = body = None
    try:
        sock = http_post_start(HOST, PORT, PATH, PACKED_LEN, headers)
        sent = stream_upimage_to_http(uart, SENSOR_ADDRESS, sock)
        status_code, head_str, body = http_read_response(sock)
        text = (body or b"").decode("utf-8", "ignore")
        nid = None
        try:
            res = ujson.loads(text)
            nid = res.get("nid") or res.get("match_id")
        except Exception:
            pass
        if nid:
            led_success()
            send_json({"status": "success", "action": "detect", "nid": nid})
        else:
            led_failure()
            send_json({"status": "error", "action": "detect", "nid": None})
    except Exception as e:
        led_failure()
        send_json({"status": "error", "action": "detect", "message": str(e)})
    wait_for_lift(f)
    clear_after_cycle(uart, f, extra_objs=[sock, head_str, body])

# ====== Boot ======
wifi_connect()
uart = UART(2, baudrate=BAUD, tx=UART_TX, rx=UART_RX, timeout=2000, rxbuf=8192)
f = PyFingerprint(uart)
if not f.verifyPassword(): raise RuntimeError("Sensor not found or wrong password")
print("✔ Sensor OK. Commands: detect | stop | quit")
# Show READY at idle
led_ready()

# ====== Command loop ======
print("✔ Ready for JSON commands: {cmd:ENROLL,nid:...} or {cmd:DETECT}")
while True:
    try:
        line = sys.stdin.readline()
        if not line:
            time.sleep_ms(50)
            continue
        line = line.strip()
        if not line:
            continue

        try:
            cmd_obj = ujson.loads(line)
        except ValueError:
            send_json({"status": "error", "message": "Invalid JSON"})
            continue

        cmd = str(cmd_obj.get("cmd", "")).upper()
        if cmd == "ENROLL":
            nid = cmd_obj.get("nid")
            if not nid:
                send_json({"status": "error", "message": "Missing NID"})
            else:
                detect_mode(uart, f, nid)

        elif cmd == "DETECT":
            detect_single(uart, f)

        else:
            send_json({"status": "error", "message": "Unknown command"})
    except Exception as e:
        send_json({"status": "error", "message": str(e)})
