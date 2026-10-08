import cv2
import time
import numpy as np
import joblib
import mediapipe as mp
import sys
import os
from insightface.app import FaceAnalysis
import serial

# ------------ CONFIG ------------
MODEL_PATH = "face_encodings.pkl"
RECOGNITION_DURATION = 50.0
SIM_THRESHOLD = 0.5

# Liveness thresholds
BLINK_CLOSED_THRESH = 0.22
BLINK_OPEN_THRESH = 0.28
BLINK_CLOSED_FRAMES = 4
BLINK_OPEN_FRAMES = 4
REQUIRED_BLINKS = 3
MIN_BLINK_DURATION = 0.1
MAX_BLINK_DURATION = 0.8
YAW_THRESH = 15.0

# Serial config
SERIAL_PORT = "COM4"      # Change if needed
SERIAL_BAUD = 115200
SERIAL_TIMEOUT = 0.5

# Cooldown between full cycles to avoid spamming (seconds)
CYCLE_COOLDOWN = 1.5

# ------------ HELPERS ------------
def safe_destroy(win):
    try:
        cv2.destroyWindow(win)
    except cv2.error:
        pass

class SerialManager:
    def __init__(self, port=SERIAL_PORT, baud=SERIAL_BAUD, timeout=SERIAL_TIMEOUT):
        self.port = port
        self.baud = baud
        self.timeout = timeout
        self.ser = None

    def open(self):
        try:
            self.ser = serial.Serial(self.port, self.baud, timeout=self.timeout)
            print(f"[SERIAL] Opened {self.port} @ {self.baud}")
        except Exception as e:
            self.ser = None
            print(f"[SERIAL] Could not open {self.port}: {e}")

    def close(self):
        try:
            if self.ser and self.ser.is_open:
                self.ser.close()
                print("[SERIAL] Closed")
        except Exception:
            pass

    def _write_line(self, line):
        if not self.ser or not self.ser.is_open:
            return
        if not line.endswith("\n"):
            line += "\n"
        try:
            self.ser.write(line.encode("utf-8"))
        except Exception as e:
            print(f"[SERIAL] write error: {e}")

    def send_auth_result(self, ok: bool):
        if ok:
            self._write_line("87,1")   # success
        else:
            self._write_line("87,0")   # failure

# ------------ INIT MODELS ------------
face_model = FaceAnalysis(name='buffalo_l')
face_model.prepare(ctx_id=0)
raw = joblib.load(MODEL_PATH)
centroids = raw.get('centroids', {}) if isinstance(raw, dict) else {}

mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5
)
LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]
MODEL_POINTS = np.array([
    (0.0, 0.0, 0.0),
    (0.0, -63.6, -12.5),
    (-43.3, 32.7, -26.0),
    (43.3, 32.7, -26.0),
    (-28.9, -28.9, -24.1),
    (28.9, -28.9, -24.1)
], dtype=np.float64)
IDX = [1, 199, 33, 263, 61, 291]

# ------------ LIVENESS UTILS ------------
def get_landmarks(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res = face_mesh.process(rgb)
    return res.multi_face_landmarks[0].landmark if res.multi_face_landmarks else None

def eye_aspect_ratio(lm, idxs, shape):
    h, w = shape[:2]
    pts = [(int(lm[i].x * w), int(lm[i].y * h)) for i in idxs]
    A = np.linalg.norm(np.subtract(pts[1], pts[5]))
    B = np.linalg.norm(np.subtract(pts[2], pts[4]))
    C = np.linalg.norm(np.subtract(pts[0], pts[3]))
    return (A + B) / (2.0 * C)

def get_image_points(lm, shape):
    h, w = shape[:2]
    return np.array([(lm[i].x * w, lm[i].y * h) for i in IDX], dtype=np.float64)

# ------------ LIVENESS CHECKS ------------
def detect_blink(cam):
    blink_count = 0
    state = 'open'
    closed_frames = open_frames = 0
    blink_start = None

    while True:
        ret, frame = cam.read()
        if not ret:
            continue

        lm = get_landmarks(frame)
        if lm is None:
            closed_frames = open_frames = 0
        else:
            ear = (eye_aspect_ratio(lm, LEFT_EYE, frame.shape) +
                   eye_aspect_ratio(lm, RIGHT_EYE, frame.shape)) / 2.0
            if state == 'open':
                if ear < BLINK_CLOSED_THRESH:
                    closed_frames += 1
                    if closed_frames >= BLINK_CLOSED_FRAMES:
                        state = 'closed'
                        blink_start = time.time()
                        closed_frames = 0
                else:
                    closed_frames = 0
            else:
                if ear > BLINK_OPEN_THRESH:
                    open_frames += 1
                    if open_frames >= BLINK_OPEN_FRAMES:
                        duration = time.time() - blink_start
                        if MIN_BLINK_DURATION < duration < MAX_BLINK_DURATION:
                            blink_count += 1
                        state = 'open'
                        open_frames = 0
                else:
                    open_frames = 0

        cv2.putText(frame, f"Blink {blink_count}/{REQUIRED_BLINKS}", (10,30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,255), 2)
        cv2.imshow("Liveness", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            return False
        if blink_count >= REQUIRED_BLINKS:
            return True

def detect_head_turn(cam):
    print("[INFO] Please turn your head to the left or right")
    while True:
        ret, frame = cam.read()
        if not ret:
            continue

        cv2.putText(frame, "Turn head left/right", (10,30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,0), 2)

        lm = get_landmarks(frame)
        if lm:
            try:
                img_pts = get_image_points(lm, frame.shape)
                f = frame.shape[1]
                c = (f / 2, frame.shape[0] / 2)
                cam_mat = np.array([[f,0,c[0]],[0,f,c[1]],[0,0,1]], dtype="double")
                dist = np.zeros((4,1))
                ok, rvec, _ = cv2.solvePnP(MODEL_POINTS, img_pts, cam_mat, dist)
                if ok:
                    rot, _ = cv2.Rodrigues(rvec)
                    yaw = abs(np.degrees(np.arctan2(rot[1,0], rot[0,0])))
                    if yaw > YAW_THRESH:
                        return True
            except Exception as e:
                print("[ERROR] Head turn detection failed:", str(e))

        cv2.imshow("Liveness", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            return False

# ------------ RECOGNITION ------------
def recognize(cam, ser: SerialManager):
    safe_destroy("Liveness")
    cv2.namedWindow("Recognition")
    start = time.time()
    while time.time() - start < RECOGNITION_DURATION:
        ret, frame = cam.read()
        if not ret:
            continue

        faces = face_model.get(frame)
        if faces:
            emb = faces[0].embedding
            sims = {lbl: emb.dot(c)/(np.linalg.norm(emb)*np.linalg.norm(c))
                    for lbl,c in centroids.items()}
            if sims:
                best_lbl, best_sim = max(sims.items(), key=lambda x: x[1])
                recognized = best_sim >= SIM_THRESHOLD
                color = (0,255,0) if recognized else (0,0,255)
                x1,y1,x2,y2 = faces[0].bbox.astype(int)
                cv2.rectangle(frame, (x1,y1), (x2,y2), color, 2)
                msg = f"{'OK' if recognized else 'FAIL'} {best_lbl if recognized else ''} {best_sim:.2f}"
                cv2.putText(frame, msg, (x1, max(30,y1-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                cv2.imshow("Recognition", frame)

                if recognized:
                    print("[AUTH] SUCCESS:", best_lbl, f"sim={best_sim:.2f}")
                    ser.send_auth_result(True)
                    return True

        cv2.imshow("Recognition", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break

    print("[AUTH] FAILED (timeout or not recognized)")
    ser.send_auth_result(False)
    return False

# ------------ MAIN (continuous) ------------
def main():
    ser = SerialManager()
    ser.open()
    cam = cv2.VideoCapture(0)
    if not cam.isOpened():
        print("[ERROR] Camera open failed")
        ser.close()
        return

    print("[INFO] Continuous mode: press 'q' to quit.")
    try:
        # Continuous loop
        while True:
            # 1) Wait for face while showing live feed
            while True:
                ret, frame = cam.read()
                if not ret:
                    continue
                faces = face_model.get(frame)
                cv2.putText(frame, "Waiting for face...", (10,30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)
                cv2.imshow("Recognition", frame)
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    raise KeyboardInterrupt
                if faces:
                    break  # proceed to liveness

            # 2) Liveness checks
            safe_destroy("Recognition")
            cv2.namedWindow("Liveness")
            print("[INFO] Liveness: blink...")
            if not detect_blink(cam):
                # user aborted or failed; go back to idle (don’t exit)
                print("[INFO] Blink failed/aborted — restarting.")
                safe_destroy("Liveness")
                time.sleep(0.5)
                continue

            print("[INFO] Liveness: head turn...")
            if not detect_head_turn(cam):
                print("[INFO] Head turn failed/aborted — restarting.")
                safe_destroy("Liveness")
                time.sleep(0.5)
                continue

            # 3) Recognition
            print("[INFO] Liveness passed — recognition...")
            result = recognize(cam, ser)

            # 4) Brief cooldown & return to waiting state
            cv2.putText(frame, f"Result: {'SUCCESS' if result else 'FAILED'}",
                        (10,60), cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                        (0,255,0) if result else (0,0,255), 2)
            cv2.imshow("Recognition", frame)
            cv2.waitKey(int(CYCLE_COOLDOWN * 1000))

            # Clean up intermediate windows but keep camera alive
            safe_destroy("Liveness")
            # Back to the top of the outer while loop to keep scanning

    except KeyboardInterrupt:
        print("\n[INFO] Quit requested.")
    except Exception as e:
        print("[ERROR]", str(e))
    finally:
        cam.release()
        cv2.destroyAllWindows()
        ser.close()
        print("[INFO] Stopped.")

if __name__ == "__main__":
    main()
