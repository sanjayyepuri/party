// Black hole gravitational lensing shader
// Uses the same color scheme as the invitation shader but with black hole distortion

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uBlackHolePos;
uniform float uBlackHoleMass;
uniform float uDistortionStrength;

varying vec2 vUv;

#define _t uTime / 10.0

// Gravitational lensing distortion - simulates how light bends around a black hole
vec2 blackHoleDistortion(vec2 uv, vec2 center, float mass, float strength) {
    vec2 dir = uv - center;
    float dist = length(dir);
    
    // Avoid division by zero
    if (dist < 0.001) {
        return uv;
    }
    
    // Schwarzschild radius approximation
    float rs = mass * 0.1;
    
    // Gravitational lensing effect - stronger near the black hole
    float lensingFactor = strength * rs / (dist + 0.1);
    
    // Radial distortion - light bends toward the black hole
    vec2 distortion = normalize(dir) * lensingFactor;
    
    return uv - distortion;
}

// Same iterative pattern function from invitation shader
vec2 itere(vec2 uv) {
    for (int i = 0; i < 8; i++) {
        uv += vec2(cos(uv.y * 3.0 + _t), -sin(uv.x * 3.0)) / 3.0;
        uv += vec2(cos(_t + uv.y), sin(_t + uv.x)) * 0.5;
        uv *= 1.3;
    }
    return uv;
}

// Same color function from invitation shader
float color(vec2 uv) {
    uv = itere(uv);
    float sc = 2.0;
    uv = mod(uv, sc) - sc / 2.0;
    return length(uv);
}

void main() {
    // Center coordinates
    vec2 center = vec2(0.0, 0.0);
    
    // Apply black hole distortion first
    vec2 uv = (vUv - 0.5) * 8.0;
    vec2 distortedUv = blackHoleDistortion(uv, center, uBlackHoleMass, uDistortionStrength);
    
    // Calculate color using the same method as invitation shader
    float c = color(distortedUv);
    float cx = color(distortedUv + vec2(0.01, 0.0)) - c;
    float cy = color(distortedUv + vec2(0.0, 0.01)) - c;
    
    // Same color output as invitation shader
    gl_FragColor = normalize(vec4(cx, sqrt(abs(cx * cy)), cy, c / 2.0));
}
