"use client";

import { wrapEffect } from "@react-three/postprocessing";
import { Effect } from "postprocessing";
import * as THREE from "three";

// Receipt shader effect - creates a thermal receipt printer aesthetic
const fragmentShader = `
uniform float pixelSize;



void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 normalizedPixelSize = pixelSize / resolution;

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
`;


class CustomReceiptEffectImpl extends Effect {
  pixelSize: number;

  constructor({ pixelSize = 16.0 }: { pixelSize?: number }) {
    const uniforms = new Map([["pixelSize", new THREE.Uniform(pixelSize)]]);

    super("ReceiptEffect", fragmentShader, {
      uniforms,
    });

    // @ts-expect-error TODO (sanjay) review why this is a read-only property.
    this.uniforms = uniforms;
    this.pixelSize = pixelSize;
  }

  update(_renderer: any, _inputBuffer: any, _deltaTime: number) {
    if (this.uniforms.has("pixelSize")) {
      this.uniforms.get("pixelSize")!.value = this.pixelSize;
    }
  }
}

const CustomReceiptEffect = wrapEffect(CustomReceiptEffectImpl);

interface ReceiptEffectProps {
  pixelSize?: number;
}

export function ReceiptEffect({ pixelSize = 8.0 }: ReceiptEffectProps) {
  // Pass pixelSize as a prop - the wrapped component will handle it
  // If pixelSize changes, React will recreate the effect
  return <CustomReceiptEffect pixelSize={pixelSize} />;
}
