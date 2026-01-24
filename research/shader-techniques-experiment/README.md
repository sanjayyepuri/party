# Shader Techniques Experiment

A learning experiment to understand three powerful shader techniques: **Swirl Field**, **Kaleidoscope**, and **Feedback Loop**.

## Getting Started

```bash
npm install
npm start
```

The app will open at `http://localhost:3000` with interactive controls to experiment with each technique.

## Techniques Explained

### 1. Swirl Field

Creates a swirling distortion effect by rotating points based on their distance from the center.

**Key Concept**: The further a point is from the center, the more it rotates.

```glsl
vec2 swirl(vec2 p, float strength) {
    float r = length(p);                    // Distance from center
    float a = atan(p.y, p.x) + strength * r; // Angle + swirl based on distance
    return r * vec2(cos(a), sin(a));         // Convert back to x,y
}
```

**How it works**:
- Convert point to polar coordinates (radius `r`, angle `a`)
- Add rotation proportional to distance: `angle += strength * radius`
- Convert back to cartesian coordinates

**Try adjusting**: The `swirlStrength` parameter to see how it affects the distortion.

---

### 2. Kaleidoscope

Creates mirror symmetry by "folding" the space into segments.

**Key Concept**: Use modulo to fold angles into a single segment, creating perfect symmetry.

```glsl
vec2 kaleidoscope(vec2 p, float segments) {
    float angle = atan(p.y, p.x);              // Get angle in radians
    angle = mod(angle, TAU / segments);        // Fold into one segment
    float r = length(p);                       // Preserve distance
    return r * vec2(cos(angle), sin(angle));   // Convert back to x,y
}
```

**How it works**:
- Calculate the angle of the point
- Use `mod(angle, TAU / segments)` to fold the angle into a single segment
- This creates perfect symmetry across multiple segments

**Try adjusting**: The `kaleidoscopeSegments` parameter to see different symmetry patterns (try 3, 4, 6, 8).

---

### 3. Feedback Loop

Creates fractal-like patterns through iterative transformations.

**Key Concept**: Repeatedly apply transformations (folding and scaling) to create self-similar patterns.

```glsl
vec2 feedback(vec2 p) {
    for (int i = 0; i < 5; i++) {
        p = abs(p) - 1.0;  // Folding: creates symmetry
        p *= 1.2;           // Scaling: creates self-similarity
    }
    return p;
}
```

**How it works**:
- `abs(p) - 1.0` creates a "fold" effect (mirrors negative values)
- Scaling by `1.2` creates self-similarity
- Multiple iterations create complex fractal structures

**Experiment with**:
- Changing the number of iterations
- Adjusting the scaling factor
- Modifying the fold amount

---

## Learning Tips

1. **Start with one technique**: Focus on understanding one technique at a time
2. **Modify the parameters**: See how each parameter affects the visual output
3. **Read the comments**: The shader code has detailed comments explaining each step
4. **Experiment**: Try combining techniques or modifying the transformations
5. **Understand the math**: 
   - Polar coordinates: `r = length(p)`, `angle = atan(p.y, p.x)`
   - Cartesian to polar: `x = r * cos(angle)`, `y = r * sin(angle)`
   - Modulo for folding: `mod(value, range)` wraps values into a range

## Next Steps

Once you understand these techniques, try:
- Combining multiple techniques
- Adding time-based animations
- Creating your own transformations
- Experimenting with different color functions
- Applying these techniques to texture coordinates

## Resources

- [The Book of Shaders](https://thebookofshaders.com/) - Great introduction to shader programming
- [Shadertoy](https://www.shadertoy.com/) - Browse and learn from community shaders
- [Inigo Quilez's Articles](https://iquilezles.org/articles/) - Advanced shader techniques
