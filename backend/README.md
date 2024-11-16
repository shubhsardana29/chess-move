# Chess Piece Detection Backend

This is the backend service for the Chess Vision AI project. It uses YOLOv8 for real-time chess piece detection and FastAPI for WebSocket communication.

## Setup Instructions

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Training the model:
- Organize your dataset in the following structure:
  ```
  dataset/
  ├── train/
  │   ├── images/
  │   └── labels/
  ├── valid/
  │   ├── images/
  │   └── labels/
  └── test/
      ├── images/
      └── labels/
  ```
- Run the training script:
  ```bash
  python train.py
  ```

4. Start the server:
```bash
python main.py
```

## Dataset Preparation

1. Collect images of chess pieces and boards
2. Label the images using tools like CVAT or LabelImg
3. Export annotations in YOLO format
4. Place images and labels in the corresponding directories

## API Endpoints

- WebSocket: `ws://localhost:8000/ws`
  - Accepts: Base64 encoded image frames
  - Returns: JSON with detected pieces and their positions

## Model Details

The system uses YOLOv8 for object detection with the following classes:
- White pieces: pawn, knight, bishop, rook, queen, king
- Black pieces: pawn, knight, bishop, rook, queen, king