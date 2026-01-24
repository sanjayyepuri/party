import { Canvas, useFrame } from "@react-three/fiber";
import { Leva, useControls } from "leva";
import { useRef, useMemo } from "react";
import * as THREE from "three";

import fragmentShader from "!!raw-loader!./fragmentShader.glsl";
import vertexShader from "!!raw-loader!./vertexShader.glsl";

function ShaderPlane() {
  const meshRef = useRef();
  const timeRef = useRef(0);

  const { speed, blackHoleMass, distortionStrength } = useControls({
    speed: {
      value: 1.0,
      min: 0.0,
      max: 5.0,
      step: 0.1,
      label: "Animation Speed",
    },
    blackHoleMass: {
      value: 2.0,
      min: 0.5,
      max: 5.0,
      step: 0.1,
      label: "Black Hole Mass",
    },
    distortionStrength: {
      value: 0.5,
      min: 0.0,
      max: 2.0,
      step: 0.1,
      label: "Distortion Strength",
    },
  });

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uBlackHolePos: { value: new THREE.Vector2(0.0, 0.0) },
        uBlackHoleMass: { value: 2.0 },
        uDistortionStrength: { value: 0.5 },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current && meshRef.current.material) {
      timeRef.current += delta * speed;
      meshRef.current.material.uniforms.uTime.value = timeRef.current;
      meshRef.current.material.uniforms.uBlackHoleMass.value = blackHoleMass;
      meshRef.current.material.uniforms.uDistortionStrength.value = distortionStrength;
    }
  });

  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

const App = () => {
  return (
    <>
      <Canvas
        gl={{
          alpha: true,
        }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 1], fov: 75 }}
      >
        <ShaderPlane />
      </Canvas>
      <Leva collapsed />
    </>
  );
};

export default App;
