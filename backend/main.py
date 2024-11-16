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


def detect_chessboard(frame):
    """Detect chessboard corners in the frame."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                 cv2.THRESH_BINARY, 11, 2)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Find the largest contour with 4 corners (the chessboard)
    chessboard_contour = None
    max_area = 0
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if area > 1000:  # Filter small contours
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
            
            if len(approx) == 4 and area > max_area:
                max_area = area
                chessboard_contour = approx
    
    if chessboard_contour is not None:
        # Sort corners
        pts = chessboard_contour.reshape(4, 2)
        rect = np.zeros((4, 2), dtype="float32")
        
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]  # Top-left
        rect[2] = pts[np.argmax(s)]  # Bottom-right
        
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]  # Top-right
        rect[3] = pts[np.argmax(diff)]  # Bottom-left
        
        return rect
    return None

def get_square_notation(x, y, board_corners):
    """Convert pixel coordinates to chess square notation (e.g., 'e4')."""
    if board_corners is None:
        return None
    
    # Perspective transform
    width = height = 800  # Target size
    dst = np.array([
        [0, 0],
        [width-1, 0],
        [width-1, height-1],
        [0, height-1]
    ], dtype="float32")
    
    M = cv2.getPerspectiveTransform(board_corners, dst)
    point = np.array([[[x, y]]], dtype="float32")
    transformed = cv2.perspectiveTransform(point, M)[0][0]
    
    # Calculate square
    square_size = width / 8
    file_idx = int(transformed[0] / square_size)
    rank_idx = int(transformed[1] / square_size)
    
    files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    ranks = ['8', '7', '6', '5', '4', '3', '2', '1']
    
    if 0 <= file_idx < 8 and 0 <= rank_idx < 8:
        return files[file_idx] + ranks[rank_idx]
    return None

async def process_frame(frame_bytes):
    """Process a frame and return detected pieces."""
    # Decode base64 image
    nparr = np.frombuffer(base64.b64decode(frame_bytes), np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Detect chessboard
    board_corners = detect_chessboard(frame)
    
    # Run YOLOv8 detection
    results = model(frame)
    
    detected_pieces = []
    for r in results:
        boxes = r.boxes
        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            conf = float(box.conf[0].cpu().numpy())
            cls = int(box.cls[0].cpu().numpy())
            
            # Calculate center point
            center_x = (x1 + x2) / 2
            center_y = (y1 + y2) / 2
            
            # Get chess square notation
            square = get_square_notation(center_x, center_y, board_corners)
            
            if square and cls in CHESS_PIECES:
                detected_pieces.append({
                    "piece": CHESS_PIECES[cls],
                    "position": square,
                    "confidence": conf
                })
    
    return detected_pieces

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive base64 encoded frame
            frame_data = await websocket.receive_text()
            
            # Process frame
            detected_pieces = await process_frame(frame_data)
            
            # Send results back
            await websocket.send_json({
                "detected_pieces": detected_pieces
            })
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)