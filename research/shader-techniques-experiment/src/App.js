import { Canvas, useFrame } from "@react-three/fiber";
import { Leva, useControls } from "leva";
import { useRef, useMemo } from "react";
import * as THREE from "three";

import fragmentShader from "!!raw-loader!./fragmentShader.glsl";
import vertexShader from "!!raw-loader!./vertexShader.glsl";

function ShaderPlane() {
  const meshRef = useRef();
  const timeRef = useRef(0);

  const { 
    technique, 
    speed, 
    swirlStrength, 
    kaleidoscopeSegments 
  } = useControls({
    technique: {
      value: 0,
      options: {
        "Swirl Field": 0,
        "Kaleidoscope": 1,
        "Feedback Loop": 2,
      },
      label: "Technique",
    },
    speed: {
      value: 1.0,
      min: 0.0,
      max: 5.0,
      step: 0.1,
      label: "Animation Speed",
    },
    swirlStrength: {
      value: 2.0,
      min: 0.0,
      max: 10.0,
      step: 0.1,
      label: "Swirl Strength",
    },
    kaleidoscopeSegments: {
      value: 6.0,
      min: 2.0,
      max: 20.0,
      step: 1.0,
      label: "Kaleidoscope Segments",
    },
  });

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uTechnique: { value: 0 },
        uStrength: { value: 2.0 },
        uSegments: { value: 6.0 },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current && meshRef.current.material) {
      timeRef.current += delta * speed;
      meshRef.current.material.uniforms.uTime.value = timeRef.current;
      meshRef.current.material.uniforms.uTechnique.value = technique;
      meshRef.current.material.uniforms.uStrength.value = swirlStrength;
      meshRef.current.material.uniforms.uSegments.value = kaleidoscopeSegments;
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
      <Leva collapsed={false} />
    </>
  );
};

export default App;
