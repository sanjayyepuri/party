# Depth Map Generator

A Python tool for generating depth maps from 2D images using pre-trained deep learning models. Optimized for creating iOS lock screen-style parallax effects.

## Features

- **Depth Anything V2** (default): Optimized for iOS lock screen-style parallax effects
  - Produces high-frequency details for sharp depth boundaries
  - Excellent foreground/background separation
  - Fast processing with high-resolution output
- **MiDaS** (alternative): General-purpose depth estimation with multiple model sizes

## Installation

This project uses [uv](https://github.com/astral-sh/uv) for package management.

### Prerequisites

- Python 3.8 or higher
- [uv](https://github.com/astral-sh/uv) package manager

### Setup

1. Install uv (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

## Usage

### Basic Usage

Generate a depth map using Depth Anything V2 (default):
```bash
uv run python generate_depth_map.py input.jpg --output depth_map.png
```

Or if you're in a uv environment:
```bash
python generate_depth_map.py input.jpg --output depth_map.png
```

### Using MiDaS

Generate a depth map using MiDaS:
```bash
uv run python generate_depth_map.py input.jpg --output depth_map.png --model midas
```

### Options

- `--output, -o`: Output path (default: `input_name_depth.png`)
- `--model, -m`: Model to use (`depth-anything-v2` or `midas`, default: `depth-anything-v2`)
- `--midas-size`: MiDaS model size (`small`, `base`, or `large`, default: `large`)
- `--invert`: Invert depth map (white = near, black = far)
- `--device`: Device to use (`cpu`, `cuda`, or `mps`, auto-detect if not specified)

### Examples

Generate depth map for Arc de Triomphe image:
```bash
uv run python generate_depth_map.py arc-de-triomphe.jpg --output arc-de-triomphe-depth.png
```

Generate with inverted depth (white = near):
```bash
uv run python generate_depth_map.py input.jpg --output depth.png --invert
```

Use MiDaS large model:
```bash
uv run python generate_depth_map.py input.jpg --output depth.png --model midas --midas-size large
```

Force CPU usage:
```bash
uv run python generate_depth_map.py input.jpg --output depth.png --device cpu
```

## Output Format

Depth maps are saved as grayscale PNG files:
- **Default**: White = far, Black = near
- **With `--invert`**: White = near, Black = far

## Model Selection

### Depth Anything V2 (Recommended for iOS Lock Screen Effect)

- **Best for**: Parallax effects requiring clear foreground/background separation
- **Speed**: Fast
- **Quality**: High-frequency details, sharp boundaries
- **Use case**: iOS lock screen-style parallax, portrait photos

### MiDaS

- **Best for**: General-purpose depth estimation
- **Speed**: Moderate to slow (depending on model size)
- **Quality**: Smooth, general depth maps
- **Model sizes**:
  - `small`: Fastest, lower quality
  - `base`: Balanced
  - `large`: Slowest, highest quality

## Workflow

1. Generate depth map from source image
2. Import both original image and depth map as assets in web application
3. Use depth map in parallax shader for iOS lock screen-style effect

## Notes

- Models are automatically downloaded on first use (requires internet connection)
- First run may take longer as models are downloaded
- GPU acceleration (CUDA/MPS) significantly speeds up processing
- Depth maps are normalized to 0-255 grayscale range
