import cv2
import time
import numpy as np
import joblib
import mediapipe as mp
import sys
from insightface.app import FaceAnalysis

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

# ------------ HELPERS ------------
def safe_destroy(win):
    try:
        cv2.destroyWindow(win)
    except cv2.error:
        pass

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
            for i in LEFT_EYE + RIGHT_EYE:
                x, y = int(lm[i].x * frame.shape[1]), int(lm[i].y * frame.shape[0])
                cv2.circle(frame, (x, y), 2, (0,255,0), -1)

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
        if cv2.waitKey(1) & 0xFF == ord('q'):
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
                for i in LEFT_EYE + RIGHT_EYE:
                    x, y = int(lm[i].x * frame.shape[1]), int(lm[i].y * frame.shape[0])
                    cv2.circle(frame, (x, y), 2, (255,0,0), -1)

                img_pts = get_image_points(lm, frame.shape)
                f = frame.shape[1]
                c = (f / 2, frame.shape[0] / 2)
                cam_mat = np.array([[f,0,c[0]],[0,f,c[1]],[0,0,1]], dtype="double")
                dist = np.zeros((4,1))
                ok, rvec, _ = cv2.solvePnP(MODEL_POINTS, img_pts, cam_mat, dist)

                if ok:
                    rot, _ = cv2.Rodrigues(rvec)
                    yaw = abs(np.degrees(np.arctan2(rot[1,0], rot[0,0])))
                    print(f"[DEBUG] Yaw: {yaw:.2f}")
                    if yaw > YAW_THRESH:
                        return True
            except Exception as e:
                print("[ERROR] Head turn detection failed:", str(e))

        cv2.imshow("Liveness", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            return False


# ------------ RECOGNITION ------------
def recognize(cam):
    safe_destroy("Liveness")
    cv2.namedWindow("Recognition")
    start = time.time()
    while time.time() - start < RECOGNITION_DURATION:
        ret, frame = cam.read()
        if not ret:
            continue

        lm = get_landmarks(frame)
        if lm:
            for i in LEFT_EYE + RIGHT_EYE:
                x, y = int(lm[i].x * frame.shape[1]), int(lm[i].y * frame.shape[0])
                cv2.circle(frame, (x, y), 2, (0,0,255), -1)

        faces = face_model.get(frame)
        if faces:
            emb = faces[0].embedding
            sims = {lbl: emb.dot(c)/(np.linalg.norm(emb)*np.linalg.norm(c))
                    for lbl,c in centroids.items()}
            if sims:
                best_lbl, best_sim = max(sims.items(), key=lambda x: x[1])
                recognized = best_sim >= SIM_THRESHOLD
                label = best_lbl if recognized else "Unknown"
                color = (0,255,0) if recognized else (0,0,255)
                x1,y1,x2,y2 = faces[0].bbox.astype(int)
                cv2.rectangle(frame, (x1,y1), (x2,y2), color, 2)
                text = f"Voter: {label}" if recognized else "Not recognized"
                cv2.putText(frame, text, (x1, y1-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
                
                cv2.imshow("Recognition", frame)

                if recognized:
                    print("Matched ID:", label)
                    print("Matched Name:", label)
                    print(f"Confidence: {best_sim:.2f}")
                    print("RESULT = SUCCESS")
                    return True
        else:
            cv2.imshow("Recognition", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    print("RESULT = FAILED")
    return False

# ------------ MAIN ------------
def main():
    try:
        cam = cv2.VideoCapture(0)
        print("[INFO] Waiting for face...")
        while cam.isOpened():
            ret, frame = cam.read()
            if not ret:
                continue
            faces = face_model.get(frame)
            cv2.imshow("Recognition", frame)
            if not faces and (cv2.waitKey(1) & 0xFF) == ord('q'):
                break
            if faces:
                safe_destroy("Recognition")
                print("[INFO] Starting liveness check...")
                cv2.namedWindow("Liveness")
                if not detect_blink(cam):
                    break
                print("[INFO] Starting head turn detection...")
                if not detect_head_turn(cam):
                    break
                print("[INFO] Liveness passed, starting recognition...")
                result = recognize(cam)
                cam.release()
                cv2.destroyAllWindows()
                sys.exit(0 if result else 1)
        cam.release()
        cv2.destroyAllWindows()
        print("RESULT = FAILED")
        sys.exit(1)
    except Exception as e:
        print("[ERROR]", str(e))
        print("RESULT = FAILED")
        sys.exit(2)

if __name__ == "__main__":
    main()
