import os
import sys
import cv2
import time
import numpy as np
from insightface.app import FaceAnalysis

# --- CONFIGURATION ---
CLASSIFIER_DATA_DIR = "dataset"      # root data folder
MODEL_NAME = 'buffalo_l'           # InsightFace model
CTX_ID = 0                        # CPU-only
NUM_IMAGES = 10                    # number of images to capture
DELAY = 0                          # seconds between captures
DIFF_THRESH = 5000                 # L2 norm threshold on grayfaces

def capture_faces(nid,
                  num_images=NUM_IMAGES,
                  delay=DELAY,
                  diff_thresh=DIFF_THRESH):
    # Prepare save directory
    save_dir = os.path.join(CLASSIFIER_DATA_DIR, nid)
    os.makedirs(save_dir, exist_ok=True)

    # Initialize camera and model
    cam = cv2.VideoCapture(0)
    if not cam.isOpened():
        print("[ERROR] Could not open camera.")
        return False

    model = FaceAnalysis(name=MODEL_NAME)
    model.prepare(ctx_id=CTX_ID)

    count = 0
    last_time = 0
    prev_gray = None

    print(f"[INFO] Capturing {num_images} frames for NID: {nid}")
    print("[INFO] Press 'q' to quit early.")

    try:
        while count < num_images:
            ret, frame = cam.read()
            if not ret:
                continue

            faces = model.get(frame)
            if faces:
                face = faces[0]
                x1, y1, x2, y2 = face.bbox.astype(int)

                now = time.time()
                if now - last_time >= delay:
                    face_crop = frame[y1:y2, x1:x2]
                    gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)

                    if prev_gray is not None and gray.shape != prev_gray.shape:
                        gray_cmp = cv2.resize(gray, (prev_gray.shape[1], prev_gray.shape[0]))
                    else:
                        gray_cmp = gray

                    if prev_gray is None or cv2.norm(gray_cmp, prev_gray, cv2.NORM_L2) > diff_thresh:
                        # Annotate full frame
                        annotated = frame.copy()
                        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)

                        out_path = os.path.join(save_dir, f"{nid}_{count + 1}.jpg")
                        cv2.imwrite(out_path, annotated)
                        print(f"[INFO] Saved {count + 1}/{num_images} -> {out_path}")

                        prev_gray = gray_cmp
                        last_time = now
                        count += 1

            # Show live preview
            if faces:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

            cv2.putText(frame,
                        f"{count}/{num_images} captured",
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                        0.7, (255, 255, 255), 2)
            remaining = max(0, delay - (time.time() - last_time))
            cv2.putText(frame,
                        f"Next in: {remaining:.1f}s",
                        (10, 60), cv2.FONT_HERSHEY_SIMPLEX,
                        0.6, (200, 200, 0), 2)

            cv2.imshow("Face Capture", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("[INFO] Interrupted by user.")
                return False

    finally:
        cam.release()
        cv2.destroyAllWindows()
        print(f"[INFO] Done. {count} images saved to {save_dir}")

    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python cap.py <nid>")
        sys.exit(1)

    nid = sys.argv[1]
    success = capture_faces(nid)
    sys.exit(0 if success else 1)
