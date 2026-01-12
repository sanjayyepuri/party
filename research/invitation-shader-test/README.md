# iOS Wave Pattern Shader Test

This research project implements an iOS iMessage-style wave pattern shader using React + Three.js. The shader creates animated, flowing waves similar to the effect seen when sending messages in iMessage.

## Overview

The project uses a simple `ShaderMaterial` approach (no post-processing) to render animated waves on a fullscreen plane. The shader creates multiple layered waves with smooth animations and customizable colors.

## Features

- **Animated Wave Pattern**: Multiple wave layers that flow across the screen
- **Customizable Colors**: Adjust primary and secondary wave colors via Leva controls
- **Real-time Parameters**: Control wave speed, frequency, and amplitude
- **Smooth Animations**: Uses smoothstep functions for soft, flowing wave edges
- **iOS-inspired Design**: Mimics the visual style of iOS iMessage wave effects

## Project Structure

```
invitation-shader-test/
├── package.json          # Dependencies and scripts
├── craco.config.js       # Webpack config for GLSL imports
├── public/
│   └── index.html        # HTML template
├── src/
│   ├── App.js            # Main React component with Canvas
│   ├── fragmentShader.glsl  # Wave pattern fragment shader
│   ├── vertexShader.glsl    # Simple vertex shader
│   ├── index.js          # React entry point
│   └── index.css         # Basic styling
└── README.md             # This file
```

## Shader Explanation

### Fragment Shader (`fragmentShader.glsl`)

The fragment shader creates the wave pattern using:

1. **Wave Function**: Combines multiple sine waves with different frequencies and phases to create complex, flowing patterns
   ```glsl
   float wave(vec2 uv, float time, float frequency, float speed) {
       float wave1 = sin(uv.x * frequency + time * speed) * amplitude;
       float wave2 = sin(uv.x * frequency * 1.3 + time * speed * 0.8) * amplitude * 0.7;
       float wave3 = sin(uv.x * frequency * 0.7 + time * speed * 1.2) * amplitude * 0.5;
       return wave1 + wave2 + wave3;
   }
   ```

2. **Multiple Wave Layers**: Creates three separate wave layers at different vertical positions and with different timing offsets

3. **Smooth Edges**: Uses `smoothstep` to create soft, blurred wave edges instead of hard lines

4. **Color Blending**: Combines primary and secondary colors with different intensities for each wave layer

5. **Glow Effect**: Adds a subtle glow around the waves for depth

### Vertex Shader (`vertexShader.glsl`)

Simple vertex shader that:
- Passes UV coordinates to the fragment shader
- Transforms vertex positions using standard Three.js matrices

### Uniforms

- `uTime`: Current animation time (updated each frame)
- `uResolution`: Screen resolution (for potential future use)
- `uColor1`: Primary wave color (default: iOS blue `#007AFF`)
- `uColor2`: Secondary wave color (default: iOS purple `#5856D6`)
- `uWaveSpeed`: Animation speed multiplier
- `uWaveFrequency`: Number of wave cycles across the screen
- `uWaveAmplitude`: Height/intensity of the waves

## Running the Project

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

4. Use the Leva controls (button in top-left) to adjust:
   - **Wave Speed**: How fast the waves animate
   - **Wave Frequency**: How many wave cycles appear
   - **Wave Amplitude**: How tall/intense the waves are
   - **Primary Color**: Main wave color
   - **Secondary Color**: Secondary wave color

## Customization

### Changing Colors

The default colors match iOS iMessage (`#007AFF` blue and `#5856D6` purple). You can change them via:
- Leva controls in the UI
- Default values in `App.js` `useControls` hook

### Adjusting Wave Behavior

Modify the wave function in `fragmentShader.glsl`:
- Change the frequency multipliers (`1.3`, `0.7`) for different wave patterns
- Adjust speed multipliers (`0.8`, `1.2`) for different animation timing
- Modify amplitude multipliers (`0.7`, `0.5`) for different wave intensities

### Adding More Waves

To add additional wave layers:
1. Create a new wave distance calculation:
   ```glsl
   float wave4Dist = uv.y - (0.5 + wave(uv, time + offset, frequency, speed) * amplitude);
   float wave4 = smoothWave(wave4Dist, width);
   ```
2. Add it to the color calculation:
   ```glsl
   color += uColor1 * wave4 * intensity;
   ```

## Technical Details

### Why No Post-Processing?

This implementation uses a direct `ShaderMaterial` on a fullscreen plane instead of post-processing effects because:
- **Simpler**: No need for EffectComposer or post-processing pipeline
- **More Direct**: Direct control over the shader uniforms
- **Better Performance**: Fewer rendering passes
- **Easier to Understand**: Clear, straightforward shader application

### Wave Mathematics

The waves use sine functions with:
- **Horizontal Position**: `uv.x * frequency` creates the wave pattern across the screen
- **Time Animation**: `time * speed` makes the waves move
- **Multiple Frequencies**: Different frequency multipliers create layered, complex patterns
- **Smooth Interpolation**: `smoothstep` creates soft edges instead of hard sine wave edges

## Potential Modifications for Invitations

- **Color Schemes**: Match party themes (e.g., warm oranges/reds for a summer party)
- **Wave Direction**: Change from horizontal to vertical or diagonal waves
- **Text Integration**: Add text that follows the wave pattern
- **Interactive Elements**: Respond to mouse/touch input
- **Particle Effects**: Add particles that follow the wave motion
- **Gradient Backgrounds**: Replace solid colors with gradients

## Dependencies

- `react` and `react-dom` (^18.0.0)
- `@react-three/fiber` (^8.17.10) - React renderer for Three.js
- `three` (^0.169.0) - 3D graphics library
- `leva` (^0.9.31) - GUI controls for tweaking parameters
- `@craco/craco` and `raw-loader` - For importing GLSL files

## References

- [Three.js ShaderMaterial Documentation](https://threejs.org/docs/#api/en/materials/ShaderMaterial)
- [GLSL Reference](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
