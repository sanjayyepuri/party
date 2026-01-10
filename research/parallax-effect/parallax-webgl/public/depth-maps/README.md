# Depth Maps Directory

Place your generated depth maps here.

For the demo, add:
- `arc-de-triomphe-depth.png` (generated from arc-de-triomphe.jpg)

Generate depth maps using:
```bash
cd ../../depth-map-generator
uv run python generate_depth_map.py ../launch-party-parallax/public/images/arc-de-triomphe.jpg --output ../launch-party-parallax/public/depth-maps/arc-de-triomphe-depth.png
```
