# File: ai-service/main.py

from fastapi import FastAPI, UploadFile, File
from transformers import ViTImageProcessor, ViTForImageClassification
from PIL import Image
import torch

app = FastAPI()

# Load the pre-trained model and processor
processor = ViTImageProcessor.from_pretrained('google/vit-base-patch16-224')
model = ViTForImageClassification.from_pretrained('google/vit-base-patch16-224')

# --- NEW: Prioritized Keyword Mapping ---
# We will check for keywords in this specific order.
# "Garbage Dump" is first, so it has the highest priority.
# File: ai-service/main.py

KEYWORD_CATEGORIES = [
    ("Garbage Dump", ["garbage", "trash", "litter", "dumpster", "waste", "bag"]),
    ("Fallen Debris", ["tree", "branch", "log", "debris", "wood"]), # NEW
    ("Abandoned Vehicle", ["car", "vehicle", "truck", "van", "automobile"]), # NEW
    ("Broken Streetlight", ["streetlight", "street sign", "traffic light", "lamp post"]),
    ("Water Leak", ["sewer", "drainage", "grate", "leak", "water", "hydrant"]), # Updated
    ("Graffiti / Vandalism", ["graffiti", "vandalism", "spray paint", "defaced"]), # NEW
    ("Pothole", ["pothole", "manhole", "crack", "pavement", "road"]),
]

@app.post("/analyze-image/")
async def analyze_image(file: UploadFile = File(...)):
    # Open the uploaded image file
    image = Image.open(file.file).convert("RGB")

    # Process the image and make a prediction
    inputs = processor(images=image, return_tensors="pt")
    outputs = model(**inputs)
    logits = outputs.logits
    predicted_class_idx = logits.argmax(-1).item()
    predicted_label = model.config.id2label[predicted_class_idx].lower()

    # --- NEW: Improved Categorization Logic ---
    found_category = "Uncategorized"
    # This loop iterates through our prioritized list.
    # It will stop as soon as it finds the first match.
    for category, keywords in KEYWORD_CATEGORIES:
        if any(keyword in predicted_label for keyword in keywords):
            found_category = category
            break

    # Determine urgency based on the found category
    urgency = "Medium"
    if found_category in ["Pothole", "Sewage Leak"]:
        urgency = "High"
    elif found_category in ["Uncategorized", "Garbage Dump"]:
        urgency = "Low"

    return {
        "issueType": found_category,
        "urgency": urgency,
        "autoCaption": f"Detected a {urgency} urgency issue: {found_category}."
    }