import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, wrapEffect } from "@react-three/postprocessing";
import { Leva, useControls } from "leva";
import { Effect } from "postprocessing";
import { Suspense, useRef } from "react";
import * as THREE from "three";

import fragmentShader from "!!raw-loader!./fragmentShader.glsl";

class CustomReceiptEffectImpl extends Effect {
  constructor({ pixelSize = 1.0 }) {
    const uniforms = new Map([["pixelSize", new THREE.Uniform(pixelSize)]]);

    super("MyCustomEffect", fragmentShader, {
      uniforms,
    });

    this.uniforms = uniforms;
  }

  update(_renderer, _inputBuffer, _deltaTime) {
    this.uniforms.get("pixelSize").value = this.pixelSize;
  }
}

const CustomReceiptEffect = wrapEffect(CustomReceiptEffectImpl);

export const ReceiptEffect = () => {
  const effectRef = useRef();

  const { pixelSize } = useControls({
    pixelSize: {
      value: 8.0,
      min: 8.0,
      max: 32.0,
      step: 2.0,
    },
  });

  useFrame((state) => {
    const { camera } = state;

    if (effectRef.current) {
      effectRef.current.pixelSize = pixelSize;
    }

    camera.lookAt(0, 0, 0);
  });

  return (
    <EffectComposer>
      <CustomReceiptEffect ref={effectRef} pixelSize={pixelSize} />
    </EffectComposer>
  );
};

const Receipt = () => {
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[-0, 0, -5]}
        zoom={100}
        near={0.01}
        far={500}
      />

      <mesh>
        <torusKnotGeometry args={[1, 0.4, 100, 16]} color="orange" />
        <meshStandardMaterial color="orange" />
      </mesh>
      <ReceiptEffect />
    </>
  );
};

const App = () => {
  return (
    <>
      <Canvas
        shadows
        gl={{
          alpha: true,
        }}
        dpr={[1, 1.5]}
      >
        <Suspense>
          <color attach="background" args={["#ffffff"]} />
          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 10, -5]} intensity={8.0} />
          <OrbitControls />
          <Receipt />
        </Suspense>
      </Canvas>
      <Leva collapsed />
    </>
  );
};

export default App;
