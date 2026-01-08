"use client";

import { OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { EffectComposer as PostEffectComposer } from "postprocessing";
import { Suspense, useRef, useEffect } from "react";
import { ReceiptEffect } from "./receipt-effect";
import * as THREE from "three";

interface ReceiptCanvasProps {
  className?: string;
  pixelSize?: number;
  scale?: number;
}

function RotatingKnot({ scale = 1.0 }: { scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} scale={scale}>
      <torusKnotGeometry args={[1, 0.4, 100, 16]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

function ReceiptScene({ pixelSize = 8.0, scale = 1.0 }: { pixelSize?: number; scale?: number }) {
  const { size, gl } = useThree();
  const composerRef = useRef<PostEffectComposer | null>(null);

  useEffect(() => {
    // Force resize when size changes
    if (composerRef.current) {
      composerRef.current.setSize(size.width, size.height);
    }
    gl.setSize(size.width, size.height);
  }, [size.width, size.height, gl]);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[0, 0, 5]}
        zoom={100}
        near={0.01}
        far={500}
      />

      <RotatingKnot scale={scale} />

      <EffectComposer ref={composerRef}>
        <ReceiptEffect pixelSize={pixelSize} />
      </EffectComposer>
    </>
  );
}

export function ReceiptCanvas({
  className = "",
  pixelSize = 8.0,
  scale = 1.0,
}: ReceiptCanvasProps) {
  return (
    <Canvas
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
      shadows
      gl={{
        alpha: true,
      }}
      dpr={[1, 1.5]}
      resize={{ scroll: false, debounce: 0 }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={["#ffffff"]} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 10, -5]} intensity={8.0} />
        <ReceiptScene pixelSize={pixelSize} scale={scale} />
      </Suspense>
    </Canvas>
  );
}
