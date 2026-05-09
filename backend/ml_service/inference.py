"""
REAS Road Analysis — FastAPI Microservice
==========================================
Exposes two endpoints:
  GET  /health   → liveness check
  POST /analyze  → upload satellite image → road mask + blockage alert

Run with:
  uvicorn inference:app --host 0.0.0.0 --port 8000 --reload
"""

import base64
import io
import os

import cv2
import numpy as np
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from model import build_unet

# ─── App Setup ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="REAS Road Analysis API",
    description="AI-powered road extraction and blockage detection for REAS.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Model Config ────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "road_extraction_model.pth")
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
IMG_SIZE = 256
BLOCKAGE_THRESHOLD = 5.0   # % of pixels — below this = blocked road

model: torch.nn.Module | None = None
model_loaded_from_file = False


def load_model() -> None:
    """Load U-Net weights from disk (if available) or use random weights as demo."""
    global model, model_loaded_from_file

    net = build_unet()

    if os.path.exists(MODEL_PATH):
        try:
            state = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True)
            net.load_state_dict(state)
            model_loaded_from_file = True
            print(f"[REAS ML] Model loaded from: {MODEL_PATH}")
        except Exception as e:
            print(f"[REAS ML] WARNING: Could not load weights ({e}). Using random weights.")
    else:
        print(
            f"[REAS ML] WARNING: '{MODEL_PATH}' not found.\n"
            "            Copy your trained 'road_extraction_model.pth' here.\n"
            "            Running with RANDOM weights -- predictions are meaningless."
        )

    net.to(DEVICE)
    net.eval()
    model = net


# ─── Startup ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event() -> None:
    load_model()


# ─── Routes ──────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    """Liveness check."""
    return {
        "status": "ok",
        "device": str(DEVICE),
        "model_loaded_from_file": model_loaded_from_file,
        "model_path": MODEL_PATH,
    }


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    """
    Accept a satellite image (JPG/PNG) and return:
      - road_coverage_pct  : float — percentage of image area detected as road
      - is_blocked         : bool  — True if coverage < BLOCKAGE_THRESHOLD
      - status             : str   — "clear" | "blocked"
      - mask_base64        : str   — PNG road mask encoded as base64
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not ready yet.")

    # ── Read & Validate Image ─────────────────────────────────────────────
    raw_bytes = await file.read()
    nparr = np.frombuffer(raw_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Could not decode image. Send a valid JPG or PNG.")

    # ── Preprocess ────────────────────────────────────────────────────────
    img_resized = cv2.resize(img_bgr, (IMG_SIZE, IMG_SIZE))
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    img_norm = img_rgb.astype(np.float32) / 255.0                      # [0, 1]
    img_tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0).to(DEVICE)  # (1, 3, H, W)

    # ── Inference ─────────────────────────────────────────────────────────
    with torch.no_grad():
        pred = model(img_tensor)                    # (1, 1, H, W)

    pred_np: np.ndarray = pred.squeeze().cpu().numpy()  # (H, W)  values in [0,1]

    # ── Metrics ───────────────────────────────────────────────────────────
    road_pixels = int((pred_np > 0.5).sum())
    total_pixels = IMG_SIZE * IMG_SIZE
    road_coverage_pct = round(float(road_pixels / total_pixels * 100), 2)
    is_blocked = road_coverage_pct < BLOCKAGE_THRESHOLD

    # ── Build Coloured Mask ───────────────────────────────────────────────
    #   Green tint = road detected
    binary_mask = (pred_np > 0.5).astype(np.uint8)
    colour_mask = np.zeros((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8)
    colour_mask[binary_mask == 1] = [0, 200, 80]   # road pixels → green

    # Blend with original image for overlay
    overlay = cv2.addWeighted(img_resized, 0.6, colour_mask, 0.4, 0)

    _, buf = cv2.imencode(".png", overlay)
    mask_b64 = base64.b64encode(buf).decode("utf-8")

    # ── Raw mask (grayscale) for optional separate use ────────────────────
    raw_mask_img = (pred_np * 255).astype(np.uint8)
    _, raw_buf = cv2.imencode(".png", raw_mask_img)
    raw_mask_b64 = base64.b64encode(raw_buf).decode("utf-8")

    return {
        "road_coverage_pct": road_coverage_pct,
        "is_blocked": is_blocked,
        "status": "blocked" if is_blocked else "clear",
        "overlay_base64": mask_b64,       # coloured overlay image
        "raw_mask_base64": raw_mask_b64,  # grayscale prediction mask
    }
