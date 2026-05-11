"use client";

import { OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

interface CloudCanvasProps {
  className?: string;
  compact?: boolean;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  mat3 m = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);

  uniform vec3 uCloudSize;
  uniform vec3 uSunPosition;
  uniform vec3 uCameraPosition;
  uniform vec3 uCloudColor;
  uniform vec3 uSkyColor;
  uniform float uCloudSteps;
  uniform float uShadowSteps;
  uniform float uCloudLength;
  uniform float uShadowLength;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uFocalLength;
  uniform bool uRegress;

  float hash(float n) {
    return fract(sin(n) * 43758.5453);
  }

  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    float n = p.x + p.y * 57.0 + 113.0 * p.z;
    float res = mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                        mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                    mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                        mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
    return res;
  }

  float fbm(vec3 p) {
    float f = 0.0;
    f += 0.5000 * noise(p); p = m * p * 2.02;
    f += 0.2500 * noise(p); p = m * p * 2.03;
    f += 0.1250 * noise(p); p = m * p * 2.01;
    f += 0.0625 * noise(p);
    return f;
  }

  float cloudDepth(vec3 position) {
    vec3 drift = vec3(uTime * 0.035, uTime * 0.014, -uTime * 0.018);
    float ellipse = 1.0 - length(position * uCloudSize);
    float cloud = ellipse + fbm(position * 1.08 + drift) * 1.82 - 0.46;

    return min(max(0.0, cloud), 1.0);
  }

  vec4 cloudMarch(float jitter, vec3 position, vec3 ray) {
    float stepLength = uCloudLength / uCloudSteps;
    float shadowStepLength = uShadowLength / uShadowSteps;

    vec3 lightDirection = normalize(uSunPosition);
    vec3 cloudPosition = position + ray * jitter * stepLength;

    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);

    for (int i = 0; i < 64; i++) {
      if (float(i) >= uCloudSteps || color.a < 0.1) break;

      float depth = cloudDepth(cloudPosition);
      if (depth > 0.001) {
        vec3 lightPosition = cloudPosition + lightDirection * jitter * shadowStepLength;

        float shadow = 0.0;
        for (int s = 0; s < 16; s++) {
          if (float(s) >= uShadowSteps) break;
          lightPosition += lightDirection * shadowStepLength;
          shadow += cloudDepth(lightPosition);
        }
        shadow = exp((-shadow / uShadowSteps) * 3.0);

        float density = clamp((depth / uCloudSteps) * 22.0, 0.0, 1.0);
        color.rgb += vec3(shadow * density) * uCloudColor * color.a;
        color.a *= 1.0 - density;
        color.rgb += density * uSkyColor * color.a;
      }

      cloudPosition += ray * stepLength;
    }

    return color;
  }

  mat3 lookAt(vec3 target, vec3 origin) {
    vec3 cw = normalize(origin - target);
    vec3 cu = normalize(cross(vec3(0.0, 1.0, 0.0), cw));
    vec3 cv = normalize(cross(cw, cu));
    return mat3(cu, cv, cw);
  }

  void main() {
    vec2 pixel = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);
    float jitter = uRegress ? hash(pixel.x + pixel.y * 50.0 + uTime) : 0.0;

    mat3 camera = lookAt(uCameraPosition, vec3(0.0, 0.82, 0.0));
    vec3 ray = camera * normalize(vec3(pixel, uFocalLength));

    vec4 color = cloudMarch(jitter, uCameraPosition, ray);
    float horizon = smoothstep(-0.9, 0.9, pixel.y);
    vec3 sky = mix(vec3(0.88, 0.96, 1.0), uSkyColor, horizon);
    gl_FragColor = vec4(color.rgb + sky * color.a, 1.0);
  }
`;

function CloudShader({ compact = false }: { compact?: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, gl, invalidate } = useThree();
  const lastFrameTimeRef = useRef(0);
  const uniforms = useMemo(
    () => ({
      uCloudSize: {
        value: compact
          ? new THREE.Vector3(0.76, 0.56, 0.76)
          : new THREE.Vector3(0.5, 0.36, 0.5),
      },
      uSunPosition: { value: new THREE.Vector3(1.8, 2.4, 1.2) },
      uCameraPosition: {
        value: compact
          ? new THREE.Vector3(0.0, 0.8, 2.3)
          : new THREE.Vector3(0.0, 0.82, 2.72),
      },
      uCloudColor: { value: new THREE.Color("#ffffff") },
      uSkyColor: { value: new THREE.Color(compact ? "#bdeaff" : "#a8ddff") },
      uCloudSteps: { value: compact ? 32 : 42 },
      uShadowSteps: { value: compact ? 5 : 7 },
      uCloudLength: { value: compact ? 3.8 : 4.8 },
      uShadowLength: { value: compact ? 1.25 : 1.65 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uTime: { value: 0 },
      uFocalLength: { value: compact ? -1.36 : -1.22 },
      uRegress: { value: false },
    }),
    [compact, size.height, size.width]
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    const elapsed = state.clock.elapsedTime;
    if (elapsed - lastFrameTimeRef.current < 1 / 24) return;

    lastFrameTimeRef.current = elapsed;
    const dpr = gl.getPixelRatio();
    materialRef.current.uniforms.uTime.value = elapsed;
    materialRef.current.uniforms.uResolution.value.set(
      size.width * dpr,
      size.height * dpr
    );
  });

  useEffect(() => {
    const frameMs = 1000 / 24;
    const interval = window.setInterval(() => {
      invalidate();
    }, frameMs);

    return () => window.clearInterval(interval);
  }, [invalidate]);

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export function CloudCanvas({
  className = "",
  compact = false,
}: CloudCanvasProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Canvas
        className="absolute inset-0"
        style={{ width: "100%", height: "100%", display: "block" }}
        dpr={0.7}
        frameloop="demand"
        gl={{ alpha: false, antialias: false }}
        resize={{ scroll: false, debounce: 0 }}
      >
        <Suspense fallback={null}>
          <OrthographicCamera makeDefault position={[0, 0, 1]} />
          <CloudShader compact={compact} />
        </Suspense>
      </Canvas>
    </div>
  );
}
