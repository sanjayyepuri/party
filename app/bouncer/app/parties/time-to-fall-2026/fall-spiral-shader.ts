export const vertexShader = /* glsl */ `
  attribute vec2 aPosition;

  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  uniform float uTime;
  uniform vec2 uResolution;

  const float TAU = 6.28318530718;

  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }

  float noise(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), f.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), f.x),
      f.y
    );
  }

  float pigment(vec2 p) {
    return noise(p) * 0.57
      + noise(p * 2.07 + 17.4) * 0.29
      + noise(p * 4.13 + 31.7) * 0.14;
  }

  // Bleed neighboring pigments through most of each swath, rather than
  // drawing a hard-edged stripe. The palette is periodic across atan's seam.
  vec3 dye(float phase) {
    float x = fract(phase) * 8.0;
    vec3 a;
    vec3 b;
    vec3 ink = vec3(0.129, 0.114, 0.110);
    vec3 charcoal = vec3(0.353, 0.333, 0.322);
    vec3 ash = vec3(0.706, 0.682, 0.655);
    vec3 mahogany = vec3(0.286, 0.192, 0.176);
    vec3 taupe = vec3(0.439, 0.392, 0.373);
    vec3 smoke = vec3(0.573, 0.565, 0.545);
    vec3 graphite = vec3(0.188, 0.188, 0.184);
    vec3 chalk = vec3(0.820, 0.796, 0.757);

    if (x < 1.0) { a = ink; b = charcoal; }
    else if (x < 2.0) { a = charcoal; b = ash; }
    else if (x < 3.0) { a = ash; b = mahogany; }
    else if (x < 4.0) { a = mahogany; b = taupe; }
    else if (x < 5.0) { a = taupe; b = smoke; }
    else if (x < 6.0) { a = smoke; b = graphite; }
    else if (x < 7.0) { a = graphite; b = chalk; }
    else { a = chalk; b = ink; }

    return mix(a, b, smoothstep(0.12, 0.96, fract(x)));
  }

  void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - uResolution)
      / max(min(uResolution.x, uResolution.y), 1.0);
    p.y = -p.y;

    // Cartesian noise remains continuous across the polar angle's seam.
    vec2 cloth = p;
    vec2 drift = vec2(sin(uTime * 0.105), cos(uTime * 0.085)) * 0.38;
    vec2 warp = vec2(
      pigment(p * 3.7 + drift),
      pigment(p * 3.7 + 19.2 - drift)
    ) - 0.5;
    p += warp * 0.18 * smoothstep(0.0, 0.3, length(p));

    float radius = length(p);
    float angle = atan(p.y, p.x);
    float bloom = pigment(cloth * 9.0 + warp * 3.0 + drift);
    float twist = 3.55 * pow(radius, 0.76)
      + sin(uTime * 0.12) * radius * 0.18;
    float phase = (angle - twist + uTime * 0.07) / TAU;
    phase += (bloom - 0.5) * 0.15;

    vec3 color = dye(phase);
    // Uneven absorption and pockets of undyed cotton, with no repeating lines.
    float absorption = pigment(cloth * 26.0 + warp * 6.0 + drift * 0.6);
    float resist = smoothstep(0.48, 0.76, absorption + (bloom - 0.5) * 0.45);
    vec3 cotton = vec3(0.74, 0.72, 0.69);
    color *= 0.86 + bloom * 0.23;
    color = mix(color, cotton, resist * 0.42);
    float grain = hash(gl_FragCoord.xy) - 0.5;
    color += grain * 0.018;

    // Keep a trace of mahogany in an otherwise silver-and-charcoal print.
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luminance), color, 0.48);
    color = mix(color, cotton, 0.04);

    gl_FragColor = vec4(clamp(color * 0.78, 0.0, 1.0), 1.0);
  }
`;
