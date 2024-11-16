import asyncio
import base64
import cv2
import numpy as np
from fastapi import FastAPI, WebSocket
from ultralytics import YOLO
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the YOLO model
model = YOLO('runs/detect/chess_detector/weights/best.pt')  # Start with pretrained model, later use your custom trained model

# Chess piece classes
CHESS_PIECES = {
    0: 'bishop',
    1: 'black-bishop',
    2: 'black-king',
    3: 'black-knight',
    4: 'black-pawn',
    5: 'black-queen',
    6: 'black-rook',
    7: 'white-bishop',
    8: 'white-king',
    9: 'white-knight',
    10: 'white-pawn',
    11: 'white-queen',
    12: 'white-rook'
}


# IP Camera URL
IP_CAMERA_URL = "http://192.168.1.5:8080/video"  # Replace with your IP webcam URL


# Function to process frame and detect pieces
async def process_frame(frame_bytes):
    nparr = np.frombuffer(base64.b64decode(frame_bytes), np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    results = model(frame)

    detected_pieces = []
    for r in results:
        boxes = r.boxes
        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            conf = float(box.conf[0].cpu().numpy())
            cls = int(box.cls[0].cpu().numpy())

            detected_pieces.append({
                "piece": CHESS_PIECES[cls],
                "confidence": conf
            })

    return detected_pieces

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    cap = cv2.VideoCapture(IP_CAMERA_URL)
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                continue

            # Encode frame as base64
            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = base64.b64encode(buffer).decode('utf-8')

            # Process frame for detection
            detected_pieces = await process_frame(frame_bytes)

            # Send results to frontend
            await websocket.send_json({
                "detected_pieces": detected_pieces,
                "frame": frame_bytes
            })

            await asyncio.sleep(0.03)  # Adjust based on your performance needs
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cap.release()
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)