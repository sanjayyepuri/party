# Depth Map Visualization

A simple visualization tool for viewing depth maps with orbit camera controls.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add depth map:
   - Place `arc-de-triomphe-depth.png` in `public/depth-maps/`
   - (Generate depth map using the depth-map-generator tool first)

3. Start development server:
   ```bash
   npm run dev
   ```

## Usage

1. Generate a depth map using the depth-map-generator tool:
   ```bash
   cd ../depth-map-generator
   uv run python generate_depth_map.py arc-de-triomphe.jpg --output arc-de-triomphe-depth.png
   ```

2. Copy the depth map to this app's public directory:
   ```bash
   cp arc-de-triomphe-depth.png ../launch-party-parallax/public/depth-maps/
   ```

3. Start the demo and use orbit controls to view the depth map!

## Controls

- **Left Click + Drag**: Rotate camera
- **Right Click + Drag**: Pan camera
- **Scroll**: Zoom in/out
