uniform float pixelSize;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

vec3 sat(vec3 rgb, float adjustment) {
  const vec3 W = vec3(0.2125, 0.7154, 0.0721);
  vec3 intensity = vec3(dot(rgb, W));
  return mix(intensity, rgb, adjustment);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 normalizedPixelSize = pixelSize / resolution;
  float rowIndex = floor(uv.x / normalizedPixelSize.x);
  vec2 uvPixel = normalizedPixelSize * floor(uv / normalizedPixelSize);

  vec4 color = texture2D(inputBuffer, uvPixel);

  float luma = dot(vec3(0.2126, 0.7152, 0.0722), color.rgb);

  vec2 cellUV = fract(uv / normalizedPixelSize);
  float lineWidth = 0.0;


  if (luma > 0.0) {
    lineWidth = 1.0;
  }

  if (luma > 0.3) {
    lineWidth = 0.7;
  }

  if (luma > 0.5) {
    lineWidth = 0.5;
  }

  if (luma > 0.7) {
    lineWidth = 0.3;
  }

  if (luma > 0.9) {
    lineWidth = 0.1;
  }

  if (luma > 0.99) {
    lineWidth = 0.0;
  }

  float yStart = 0.05;
  float yEnd = 0.95;

  if (cellUV.y > yStart && cellUV.y < yEnd && cellUV.x > 0.0 && cellUV.x < lineWidth) {
    color = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    color = vec4(0.70,0.74,0.73, 1.0);
  }

  outputColor = color;
}
