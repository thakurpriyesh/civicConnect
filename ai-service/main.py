from fastapi import FastAPI, UploadFile, File
from torchvision import models
from torchvision.models import MobileNet_V2_Weights
from PIL import Image
from dotenv import load_dotenv
import torch

load_dotenv()

app = FastAPI()

# Load lightweight MobileNet model
weights = MobileNet_V2_Weights.DEFAULT

model = models.mobilenet_v2(weights=weights)

model.eval()

# Image preprocessing pipeline
transform = weights.transforms()

# Improved civic issue keyword mapping
KEYWORD_CATEGORIES = [
    (
        "Garbage Dump",
        [
            "garbage", "trash", "waste", "dustbin",
            "bin", "plastic bag", "carton", "bottle",
            "packet", "dumpster"
        ]
    ),

    (
        "Abandoned Vehicle",
        [
            "car", "vehicle", "truck", "pickup",
            "van", "automobile", "bus", "trailer",
            "tow truck", "jeep"
        ]
    ),

    (
        "Broken Streetlight",
        [
            "streetlight", "lamp", "lamp post",
            "traffic light", "street sign",
            "pole", "signal"
        ]
    ),

    (
        "Blocked Road",
        [
            "barrier", "block", "construction",
            "fence", "barricade", "obstruction",
            "debris", "tree", "branch", "log"
        ]
    ),

    (
        "Water Logging",
        [
            "water", "flood", "puddle",
            "sewer", "drain", "drainage",
            "mud", "swamp", "leak", "hydrant"
        ]
    ),

    (
        "Pothole",
        [
            "road", "street", "pavement",
            "manhole", "asphalt", "crack",
            "hole", "highway"
        ]
    ),

    (
        "Graffiti / Vandalism",
        [
            "graffiti", "spray", "wall",
            "paint", "defaced", "poster"
        ]
    ),
]

@app.post("/analyze-image/")
async def analyze_image(file: UploadFile = File(...)):
    try:
        # Open uploaded image
        image = Image.open(file.file).convert("RGB")

        # Transform image
        input_tensor = transform(image).unsqueeze(0)

        # Run model inference
        with torch.no_grad():
            outputs = model(input_tensor)

        # Get prediction
        predicted_class_idx = outputs.argmax(1).item()

        predicted_label = weights.meta["categories"][
            predicted_class_idx
        ].lower()

        print("Predicted label:", predicted_label)

        # Match civic category
        found_category = "Uncategorized"

        for category, keywords in KEYWORD_CATEGORIES:
            if any(keyword in predicted_label for keyword in keywords):
                found_category = category
                break

        # Determine urgency
        urgency = "Medium"

        if found_category in [
            "Pothole",
            "Blocked Road",
            "Water Logging"
        ]:
            urgency = "High"

        elif found_category in [
            "Garbage Dump",
            "Graffiti / Vandalism"
        ]:
            urgency = "Low"

        # Return response
        return {
            "issueType": found_category,
            "urgency": urgency,
            "autoCaption": f"Detected a {urgency} urgency issue: {found_category}.",
            "predictedLabel": predicted_label
        }

    except Exception as e:
        return {
            "issueType": "Uncategorized",
            "urgency": "Low",
            "autoCaption": "Could not analyze image.",
            "error": str(e)
        }