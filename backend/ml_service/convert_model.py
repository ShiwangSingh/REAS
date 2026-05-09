"""
Convert TensorFlow .h5 Model → PyTorch .pth
=============================================
Run this ONCE if you already have 'road_extraction_final_model.h5' from Colab.
It reads the Keras layer weights and maps them into the PyTorch U-Net.

Usage:
    python convert_model.py --h5 road_extraction_final_model.h5
                            --pth road_extraction_model.pth

Requirements (install before running):
    pip install tensorflow numpy
    (torch is already in requirements.txt)
"""

import argparse
import sys

import numpy as np
import torch


def convert(h5_path: str, pth_path: str) -> None:
    try:
        import tensorflow as tf  # type: ignore
    except ImportError:
        print("❌  TensorFlow not found. Install with:  pip install tensorflow")
        sys.exit(1)

    from model import build_unet  # type: ignore

    print(f"[convert] Loading Keras model from '{h5_path}' …")
    keras_model = tf.keras.models.load_model(h5_path)

    print("[convert] Keras layer summary:")
    for i, layer in enumerate(keras_model.layers):
        weights = layer.get_weights()
        shapes = [w.shape for w in weights]
        print(f"  [{i:02d}] {layer.name:35s} {shapes}")

    # ── Build the PyTorch U-Net and collect named parameters ──────────────
    pytorch_model = build_unet()
    pytorch_params = dict(pytorch_model.named_parameters())

    print("\n[convert] PyTorch parameter names:")
    for name, param in pytorch_params.items():
        print(f"  {name:50s} {tuple(param.shape)}")

    # ── Manual weight mapping ──────────────────────────────────────────────
    # Keras Conv2D weight shape : (kH, kW, C_in, C_out)
    # PyTorch Conv2d weight shape: (C_out, C_in, kH, kW)
    def k2p(w: np.ndarray) -> torch.Tensor:
        """Transpose Keras kernel to PyTorch layout."""
        return torch.from_numpy(w.transpose(3, 2, 0, 1))

    # Gather all Keras Conv2D layers in order
    conv_layers = [l for l in keras_model.layers if "conv2d" in l.name and "transpose" not in l.name]
    deconv_layers = [l for l in keras_model.layers if "conv2d_transpose" in l.name]

    # The Keras model has conv2d_0 … conv2d_8 (9 conv layers):
    # Indices for each block:
    #   enc1:       conv2d_0, conv2d_1
    #   enc2:       conv2d_2, conv2d_3
    #   bottleneck: conv2d_4, conv2d_5
    #   dec3:       conv2d_6
    #   dec4:       conv2d_7
    #   output:     conv2d_8
    mapping = {
        # (pytorch_layer_prefix, keras_conv_layer_index)
        "enc1.block.0": conv_layers[0],
        "enc1.block.3": conv_layers[1],
        "enc2.block.0": conv_layers[2],
        "enc2.block.3": conv_layers[3],
        "bottleneck.block.0": conv_layers[4],
        "bottleneck.block.3": conv_layers[5],
        "dec3.block.0": conv_layers[6],
        "dec4.block.0": conv_layers[7],
        "out_conv": conv_layers[8],
    }

    state = pytorch_model.state_dict()

    for pt_prefix, keras_layer in mapping.items():
        weights = keras_layer.get_weights()
        if not weights:
            continue
        kernel = weights[0]
        key = f"{pt_prefix}.weight"
        if key in state:
            converted = k2p(kernel)
            if converted.shape == state[key].shape:
                state[key] = converted
                print(f"  ✓ {pt_prefix}.weight  {converted.shape}")
            else:
                print(f"  ✗ Shape mismatch — {key}: {converted.shape} vs {state[key].shape}")

    # Deconvolution layers (ConvTranspose2d)
    deconv_mapping = {
        "up3.weight": deconv_layers[0] if len(deconv_layers) > 0 else None,
        "up4.weight": deconv_layers[1] if len(deconv_layers) > 1 else None,
    }
    for pt_key, keras_layer in deconv_mapping.items():
        if keras_layer is None:
            continue
        weights = keras_layer.get_weights()
        if not weights:
            continue
        kernel = weights[0]
        # Keras deconv: (kH, kW, C_out, C_in) → PyTorch: (C_in, C_out, kH, kW)
        converted = torch.from_numpy(kernel.transpose(3, 2, 0, 1))
        if converted.shape == state[pt_key].shape:
            state[pt_key] = converted
            print(f"  ✓ {pt_key}  {converted.shape}")
        else:
            print(f"  ✗ {pt_key}: {converted.shape} vs {state[pt_key].shape}")

    pytorch_model.load_state_dict(state)
    torch.save(pytorch_model.state_dict(), pth_path)
    print(f"\n[convert] ✅  Saved PyTorch model to '{pth_path}'")
    print("           Now copy it to backend/ml_service/road_extraction_model.pth")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert Keras .h5 model to PyTorch .pth")
    parser.add_argument("--h5",  default="road_extraction_final_model.h5", help="Path to Keras .h5 file")
    parser.add_argument("--pth", default="road_extraction_model.pth",       help="Output .pth file path")
    args = parser.parse_args()
    convert(args.h5, args.pth)
