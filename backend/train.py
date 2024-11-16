from ultralytics import YOLO


# # Define dataset configuration
# dataset_config = """
# path: ./dataset  # dataset root directory
# train: train/images  # train images (relative to path)
# val: valid/images  # validation images (relative to path)
# test: test/images  # test images (optional)

# # Classes
# names:
#   0: white_pawn
#   1: white_knight
#   2: white_bishop
#   3: white_rook
#   4: white_queen
#   5: white_king
#   6: black_pawn
#   7: black_knight
#   8: black_bishop
#   9: black_rook
#   10: black_queen
#   11: black_king
# """

# # Save dataset configuration
# with open('dataset.yaml', 'w') as f:
#     f.write(dataset_config)

# Load a model
model = YOLO('yolov8n.pt')  # load a pretrained model

# Train the model
results = model.train(
    data='roboflow_dataset/data.yaml',
    epochs=100,
    imgsz=416,
    batch=16,
    name='chess_detector'
)