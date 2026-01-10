import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer } from '@react-three/postprocessing'
import { Leva, useControls } from 'leva'
import DepthMapVisualization from './DepthMapVisualization'
import { ReceiptEffect } from './ReceiptEffect'

function App() {
  const { enableReceipt, receiptPixelSize } = useControls('Receipt Effect', {
    enableReceipt: {
      value: false,
      label: 'Enable Receipt Effect',
    },
    receiptPixelSize: {
      value: 8.0,
      min: 4.0,
      max: 32.0,
      step: 2.0,
      label: 'Receipt Pixel Size',
    },
  }, { collapsed: true })

  return (
    <>
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={[0, 0, 5]}
            fov={75}
            near={0.1}
            far={1000}
          />
          <color attach="background" args={['#1a1a1a']} />
          {/* <ambientLight intensity={0.5} />*/}
          {/* <directionalLight position={[5, 5, 5]} intensity={1} />*/}
          {/* <pointLight position={[-5, -5, 5]} intensity={0.5} />*/}
          {/* <OrbitControls enableZoom={false} />*/}
          <DepthMapVisualization />
          {enableReceipt && (
            <EffectComposer>
              <ReceiptEffect pixelSize={8} />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
      <Leva collapsed />
    </>
  )
}

export default App
