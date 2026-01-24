// Shader Techniques Experiment
// Learn three powerful shader techniques: Swirl, Kaleidoscope, and Feedback Loop

uniform float uTime;
uniform vec2 uResolution;
uniform int uTechnique;  // 0: Swirl, 1: Kaleidoscope, 2: Feedback
uniform float uStrength; // Control parameter for swirl strength
uniform float uSegments; // Number of segments for kaleidoscope

varying vec2 vUv;

#define TAU 6.28318530718  // 2 * PI

// ============================================
// TECHNIQUE 1: SWIRL FIELD
// ============================================
// Creates a swirling distortion effect by rotating points
// based on their distance from the center.
// 
// How it works:
// - Calculate distance from center (r) and angle (a)
// - Add rotation proportional to distance: angle += strength * radius
// - Convert back to cartesian coordinates
// ============================================
vec2 swirl(vec2 p, float strength) {
    float r = length(p);                    // Distance from center
    float a = atan(p.y, p.x) + strength * r; // Angle + swirl based on distance
    return r * vec2(cos(a), sin(a));         // Convert back to x,y
}

// ============================================
// TECHNIQUE 2: KALEIDOSCOPE
// ============================================
// Creates mirror symmetry by folding the space into segments.
// 
// How it works:
// - Calculate the angle of the point
// - Use modulo to "fold" the angle into a single segment
// - This creates perfect symmetry across multiple segments
// ============================================
vec2 kaleidoscope(vec2 p, float segments) {
    float angle = atan(p.y, p.x);              // Get angle in radians
    angle = mod(angle, TAU / segments);        // Fold into one segment
    float r = length(p);                       // Preserve distance
    return r * vec2(cos(angle), sin(angle));   // Convert back to x,y
}

// ============================================
// TECHNIQUE 3: FEEDBACK LOOP
// ============================================
// Creates fractal-like patterns through iterative transformations.
// 
// How it works:
// - Repeatedly apply transformations (folding and scaling)
// - abs(p) - 1.0 creates a "fold" effect
// - Scaling creates self-similar patterns
// - Multiple iterations create complex fractal structures
// ============================================
vec2 feedback(vec2 p) {
    for (int i = 0; i < 5; i++) {
        p = abs(p) - 1.0;  // Folding: creates symmetry
        p *= 1.2;           // Scaling: creates self-similarity
    }
    return p;
}

// ============================================
// MAIN SHADER CODE
// ============================================
void main() {
    // Center coordinates and scale
    vec2 uv = (vUv - 0.5) * 4.0;  // Center at origin, scale up
    
    // Apply the selected technique
    vec2 p = uv;
    
    if (uTechnique == 0) {
        // SWIRL: Apply swirl with time-based animation
        p = swirl(uv, uStrength + sin(uTime * 0.5) * 0.5);
    } else if (uTechnique == 1) {
        // KALEIDOSCOPE: Create symmetric pattern
        p = kaleidoscope(uv, uSegments);
    } else if (uTechnique == 2) {
        // FEEDBACK: Create fractal pattern
        p = feedback(uv);
    }
    
    // Create a visual pattern from the transformed coordinates
    // This creates a grid-like pattern that shows the distortion
    vec2 grid = sin(p * 3.14159) * 0.5 + 0.5;
    
    // Add some color variation
    vec3 color = vec3(
        grid.x,
        grid.y,
        (grid.x + grid.y) * 0.5
    );
    
    // Add a subtle time-based color shift
    color += vec3(
        sin(uTime * 0.3) * 0.1,
        cos(uTime * 0.4) * 0.1,
        sin(uTime * 0.5) * 0.1
    );
    
    gl_FragColor = vec4(color, 1.0);
}
