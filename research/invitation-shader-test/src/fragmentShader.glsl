// Simplified iterative pattern shader
// Based on Shadertoy shader - creates organic, flowing patterns through iteration

uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;

#define _t uTime / 10.0

vec2 itere(vec2 uv) {
    for (int i = 0; i < 8; i++) {
        uv += vec2(cos(uv.y * 3.0 + _t), -sin(uv.x * 3.0)) / 3.0;
        uv += vec2(cos(_t + uv.y), sin(_t + uv.x)) * 0.5;
        uv *= 1.3;
    }
    return uv;
}

float color(vec2 uv) {
    uv = itere(uv);
    float sc = 2.0;
    uv = mod(uv, sc) - sc / 2.0;
    return length(uv);
}

void main() {
    vec2 uv = (vUv - 0.5) * 8.0;
    float c = color(uv);
    float cx = color(uv + vec2(0.01, 0.0)) - c;
    float cy = color(uv + vec2(0.0, 0.01)) - c;
    gl_FragColor = normalize(vec4(cx, sqrt(abs(cx * cy)), cy, c / 2.0));
}
