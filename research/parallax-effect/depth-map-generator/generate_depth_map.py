#!/usr/bin/env python3
"""
Depth Map Generator
Generates depth maps from 2D images using Depth Anything V2 (default) or MiDaS models.
Optimized for iOS lock screen-style parallax effects.
"""

import argparse
import os
import sys
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation


def load_depth_anything_v2(device: torch.device) -> tuple:
    """Load Depth Anything V2 model and processor."""
    print("Loading Depth Anything V2 model...")
    try:
        processor = AutoImageProcessor.from_pretrained(
            "depth-anything/Depth-Anything-V2-Small-hf"
        )
        model = AutoModelForDepthEstimation.from_pretrained(
            "depth-anything/Depth-Anything-V2-Small-hf"
        )
        model.to(device)
        model.eval()
        print("✓ Depth Anything V2 model loaded successfully")
        return processor, model
    except Exception as e:
        print(f"Error loading Depth Anything V2: {e}")
        raise


def load_midas(device: torch.device, model_size: str = "large") -> tuple:
    """Load MiDaS model and processor."""
    print(f"Loading MiDaS {model_size} model...")
    try:
        model_name = f"Intel/dpt-{model_size}"
        processor = AutoImageProcessor.from_pretrained(model_name)
        model = AutoModelForDepthEstimation.from_pretrained(model_name)
        model.to(device)
        model.eval()
        print(f"✓ MiDaS {model_size} model loaded successfully")
        return processor, model
    except Exception as e:
        print(f"Error loading MiDaS: {e}")
        raise


def preprocess_image(image_path: str) -> np.ndarray:
    """Load and preprocess image."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    # Load image using PIL
    img = Image.open(image_path).convert("RGB")
    return np.array(img)


def generate_depth_map_depth_anything(
    image: np.ndarray, processor, model, device: torch.device
) -> np.ndarray:
    """Generate depth map using Depth Anything V2."""
    # Store original dimensions
    original_height, original_width = image.shape[:2]
    
    # Prepare inputs
    inputs = processor(images=image, return_tensors="pt").to(device)

    # Generate depth map
    with torch.no_grad():
        outputs = model(**inputs)
        predicted_depth = outputs.predicted_depth

    # Post-process depth map
    depth = predicted_depth.squeeze().cpu().numpy()
    depth = (depth - depth.min()) / (depth.max() - depth.min())  # Normalize to [0, 1]
    
    # Resize to match original image dimensions if needed
    if depth.shape[0] != original_height or depth.shape[1] != original_width:
        depth = cv2.resize(depth, (original_width, original_height), interpolation=cv2.INTER_LINEAR)
    
    depth = (depth * 255).astype(np.uint8)  # Convert to 0-255 range

    return depth


def generate_depth_map_midas(
    image: np.ndarray, processor, model, device: torch.device
) -> np.ndarray:
    """Generate depth map using MiDaS."""
    # Store original dimensions
    original_height, original_width = image.shape[:2]
    
    # Prepare inputs
    inputs = processor(images=image, return_tensors="pt").to(device)

    # Generate depth map
    with torch.no_grad():
        outputs = model(**inputs)
        predicted_depth = outputs.predicted_depth

    # Post-process depth map
    depth = predicted_depth.squeeze().cpu().numpy()
    depth = (depth - depth.min()) / (depth.max() - depth.min())  # Normalize to [0, 1]
    
    # Resize to match original image dimensions if needed
    if depth.shape[0] != original_height or depth.shape[1] != original_width:
        depth = cv2.resize(depth, (original_width, original_height), interpolation=cv2.INTER_LINEAR)
    
    depth = (depth * 255).astype(np.uint8)  # Convert to 0-255 range

    return depth


def save_depth_map(depth_map: np.ndarray, output_path: str, invert: bool = False):
    """Save depth map as grayscale PNG."""
    if invert:
        depth_map = 255 - depth_map

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)

    # Save as grayscale PNG
    depth_image = Image.fromarray(depth_map, mode="L")
    depth_image.save(output_path, "PNG")
    print(f"✓ Depth map saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate depth maps from 2D images for parallax effects"
    )
    parser.add_argument(
        "input",
        type=str,
        help="Path to input image (JPG, PNG, etc.)",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default=None,
        help="Path to output depth map (default: input_name_depth.png)",
    )
    parser.add_argument(
        "--model",
        "-m",
        type=str,
        choices=["depth-anything-v2", "midas"],
        default="depth-anything-v2",
        help="Depth estimation model to use (default: depth-anything-v2)",
    )
    parser.add_argument(
        "--midas-size",
        type=str,
        choices=["small", "base", "large"],
        default="large",
        help="MiDaS model size (default: large)",
    )
    parser.add_argument(
        "--invert",
        action="store_true",
        help="Invert depth map (white = near, black = far)",
    )
    parser.add_argument(
        "--device",
        type=str,
        choices=["cpu", "cuda", "mps"],
        default=None,
        help="Device to use (auto-detect if not specified)",
    )

    args = parser.parse_args()

    # Determine output path
    if args.output is None:
        input_path = Path(args.input)
        output_path = input_path.parent / f"{input_path.stem}_depth.png"
    else:
        output_path = Path(args.output)

    # Determine device
    if args.device:
        device = torch.device(args.device)
    else:
        if torch.cuda.is_available():
            device = torch.device("cuda")
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            device = torch.device("mps")
        else:
            device = torch.device("cpu")

    print(f"Using device: {device}")

    try:
        # Load image
        print(f"Loading image: {args.input}")
        image = preprocess_image(args.input)
        print(f"✓ Image loaded: {image.shape[1]}x{image.shape[0]}")

        # Load model
        if args.model == "depth-anything-v2":
            processor, model = load_depth_anything_v2(device)
            depth_map = generate_depth_map_depth_anything(image, processor, model, device)
        else:  # midas
            processor, model = load_midas(device, args.midas_size)
            depth_map = generate_depth_map_midas(image, processor, model, device)

        # Save depth map
        save_depth_map(depth_map, str(output_path), invert=args.invert)

        print("\n✓ Depth map generation complete!")
        return 0

    except Exception as e:
        print(f"\n✗ Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
