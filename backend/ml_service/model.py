"""
U-Net Model for Road Extraction
================================
PyTorch implementation of the U-Net architecture used to segment roads
from satellite imagery. Architecture mirrors the Keras model trained in Colab.

Input:  RGB satellite image  -> (3, 256, 256) tensor
Output: Road probability mask -> (1, 256, 256) sigmoid output
"""

import torch
import torch.nn as nn


class DoubleConv(nn.Module):
    """Two consecutive Conv2D + ReLU layers (the basic U-Net building block)."""

    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class UNet(nn.Module):
    """
    U-Net for binary road segmentation.
    Matches the Keras architecture from the Colab training notebook:
      Encoder:    64 → 128
      Bottleneck: 256
      Decoder:    128 → 64
      Output:     1 channel sigmoid
    """

    def __init__(self):
        super().__init__()

        # ── Encoder (Downsampling) ────────────────────────────────────────
        self.enc1 = DoubleConv(3, 64)        # Layer 1: 256×256 → 128×128
        self.enc2 = DoubleConv(64, 128)      # Layer 2: 128×128 →  64×64
        self.pool = nn.MaxPool2d(2, 2)

        # ── Bottleneck ────────────────────────────────────────────────────
        self.bottleneck = DoubleConv(128, 256)

        # ── Decoder (Upsampling) ──────────────────────────────────────────
        self.up3  = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
        self.dec3 = DoubleConv(256, 128)     # concat with enc2 → 256 in

        self.up4  = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.dec4 = DoubleConv(128, 64)      # concat with enc1 → 128 in

        # ── Output ────────────────────────────────────────────────────────
        self.out_conv = nn.Conv2d(64, 1, kernel_size=1)
        self.sigmoid  = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Encoder
        c1 = self.enc1(x)          # (B, 64,  256, 256)
        p1 = self.pool(c1)         # (B, 64,  128, 128)

        c2 = self.enc2(p1)         # (B, 128, 128, 128)
        p2 = self.pool(c2)         # (B, 128,  64,  64)

        # Bottleneck
        b = self.bottleneck(p2)    # (B, 256,  64,  64)

        # Decoder
        u3 = self.up3(b)           # (B, 128, 128, 128)
        u3 = torch.cat([u3, c2], dim=1)  # (B, 256, 128, 128)
        c3 = self.dec3(u3)         # (B, 128, 128, 128)

        u4 = self.up4(c3)          # (B,  64, 256, 256)
        u4 = torch.cat([u4, c1], dim=1)  # (B, 128, 256, 256)
        c4 = self.dec4(u4)         # (B,  64, 256, 256)

        return self.sigmoid(self.out_conv(c4))  # (B, 1, 256, 256)


def build_unet() -> UNet:
    """Factory function — returns a fresh U-Net instance."""
    return UNet()


if __name__ == "__main__":
    # Quick sanity check
    net = build_unet()
    dummy = torch.randn(1, 3, 256, 256)
    out = net(dummy)
    print(f"Input : {dummy.shape}")
    print(f"Output: {out.shape}")   # Expected: (1, 1, 256, 256)
    print(f"Output min/max: {out.min():.3f} / {out.max():.3f}")
    print("U-Net architecture OK [PASS]")
