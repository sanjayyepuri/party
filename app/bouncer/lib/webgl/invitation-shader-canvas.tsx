"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef, useMemo } from "react";
import * as THREE from "three";

// Vertex shader - simple pass-through for fullscreen quad
const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment shader - organic, flowing patterns through iteration
const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform float uBrightness;

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
    vec4 color = normalize(vec4(cx, sqrt(abs(cx * cy)), cy, c / 2.0));
    gl_FragColor = vec4(color.rgb * uBrightness, color.a);
}
`;

interface InvitationShaderCanvasProps {
  className?: string;
  speed?: number;
  brightness?: number;
}

function ShaderPlane({
  speed = 1.0,
  brightness = 1.0,
}: {
  speed?: number;
  brightness?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const { size } = useThree();

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        uBrightness: { value: brightness },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
  }, [brightness]);

  useFrame((_state, delta) => {
    if (meshRef.current && meshRef.current.material) {
      const shaderMaterial = meshRef.current.material as THREE.ShaderMaterial;
      timeRef.current += delta * speed;
      shaderMaterial.uniforms.uTime.value = timeRef.current;
      shaderMaterial.uniforms.uBrightness.value = brightness;
      // Update resolution on resize
      shaderMaterial.uniforms.uResolution.value.set(size.width, size.height);

      // Update plane scale to match aspect ratio
      const currentAspect = size.width / size.height;
      meshRef.current.scale.x = currentAspect;
    }
  });

  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export function InvitationShaderCanvas({
  className = "",
  speed = 1.0,
  brightness = 1.0,
}: InvitationShaderCanvasProps) {
  return (
    <Canvas
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      gl={{
        alpha: true,
      }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 1], fov: 75 }}
    >
      <Suspense fallback={null}>
        <ShaderPlane speed={speed} brightness={brightness} />
      </Suspense>
    </Canvas>
  );
}
