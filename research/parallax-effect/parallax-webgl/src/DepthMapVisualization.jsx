import { useTexture } from '@react-three/drei'
import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import * as THREE from 'three'

const AVAILABLE_IMAGES = [
  { name: 'Arc de Triomphe', image: '/images/arc-de-triomphe.jpg', depth: '/depth-maps/arc-de-triomphe-depth.png' },
  { name: 'Hercules', image: '/images/hercules.jpeg', depth: '/depth-maps/hercules-depth.png' },
]

// POM Fragment Shader
const pomFragmentShader = `
  uniform sampler2D imageTexture;
  uniform sampler2D depthMap;
  uniform float parallaxIntensity;
  uniform vec2 mouseOffset;
  uniform vec2 scrollOffset;
  uniform float depthInvert;
  varying vec2 vUv;

  void main() {
    vec2 combinedOffset = mouseOffset + scrollOffset;

    // Parallax Occlusion Mapping (POM)
    const int numSteps = 10;
    float heightScale = parallaxIntensity * 0.15;

    // View direction (normalized, pointing from surface towards viewer)
    vec2 viewDir = vec2(0.0, 0.0);
    float offsetLength = length(combinedOffset);
    if (offsetLength > 0.001) {
      viewDir = normalize(-combinedOffset);
    }

    // Maximum parallax distance based on offset magnitude
    float maxParallax = offsetLength * heightScale;

    // Step size
    float stepSize = maxParallax / float(numSteps);
    vec2 stepDir = viewDir * stepSize;

    // Start ray at surface
    vec2 rayUV = vUv;
    float rayHeight = 0.0;

    // Sample depth at starting position
    float depth = texture2D(depthMap, rayUV).r;
    if (depthInvert > 0.5) {
      depth = 1.0 - depth;
    }
    float surfaceHeight = depth * heightScale;

    // Ray march until we hit the surface
    for (int i = 0; i < numSteps; i++) {
      // If ray is still above surface, continue
      if (rayHeight < surfaceHeight) {
        rayUV += stepDir;
        rayHeight += stepSize;
        rayUV = clamp(rayUV, vec2(0.0), vec2(1.0));

        // Sample new depth
        depth = texture2D(depthMap, rayUV).r;
        if (depthInvert > 0.5) {
          depth = 1.0 - depth;
        }
        surfaceHeight = depth * heightScale;
      } else {
        // Ray has intersected surface
        // Refine position using previous step
        vec2 prevUV = rayUV - stepDir;
        prevUV = clamp(prevUV, vec2(0.0), vec2(1.0));

        float prevDepth = texture2D(depthMap, prevUV).r;
        if (depthInvert > 0.5) {
          prevDepth = 1.0 - prevDepth;
        }
        float prevSurfaceHeight = prevDepth * heightScale;
        float prevRayHeight = rayHeight - stepSize;

        // Linear interpolation to find exact intersection
        float t = (prevRayHeight - prevSurfaceHeight) /
                 ((rayHeight - surfaceHeight) - (prevRayHeight - prevSurfaceHeight));
        rayUV = mix(prevUV, rayUV, t);
        break;
      }
    }

    // Clamp final UV
    vec2 offsetUV = clamp(rayUV, vec2(0.0), vec2(1.0));

    // Sample image at intersection point
    vec4 color = texture2D(imageTexture, offsetUV);
    gl_FragColor = color;
  }
`

// Basic Displacement Fragment Shader
const basicDisplacementFragmentShader = `
  uniform sampler2D imageTexture;
  uniform sampler2D depthMap;
  uniform float parallaxIntensity;
  uniform vec2 mouseOffset;
  uniform vec2 scrollOffset;
  uniform float depthInvert;
  varying vec2 vUv;

  void main() {
    vec2 combinedOffset = mouseOffset + scrollOffset;

    // Basic Displacement Mapping
    // Sample depth at current UV
    float depth = texture2D(depthMap, vUv).r;
    if (depthInvert > 0.5) {
      depth = 1.0 - depth;
    }

    // Calculate parallax offset based on depth
    float heightScale = parallaxIntensity * 0.15;
    float parallaxOffset = depth * heightScale;

    // Offset UV directly using combinedOffset scaled by parallax
    vec2 offsetUV = vUv - combinedOffset * parallaxOffset;
    offsetUV = clamp(offsetUV, vec2(0.0), vec2(1.0));

    // Sample image at final UV position
    vec4 color = texture2D(imageTexture, offsetUV);
    gl_FragColor = color;
  }
`

export default function DepthMapVisualization() {
  const { viewport } = useThree()
  const materialRef = useRef()
  const mouseOffsetRef = useRef(new THREE.Vector2(0, 0))
  const scrollOffsetRef = useRef(new THREE.Vector2(0, 0))

  // Create uniform Vector2s outside useMemo so they persist
  const mouseOffsetUniform = useRef(new THREE.Vector2(0, 0))
  const scrollOffsetUniform = useRef(new THREE.Vector2(0, 0))

  const {
    selectedImage,
    parallaxMode,
    parallaxIntensity,
    mouseSensitivity,
    scrollSensitivity,
    depthInvert
  } = useControls('Parallax', {
    selectedImage: {
      value: AVAILABLE_IMAGES[0].name,
      options: AVAILABLE_IMAGES.map(img => img.name),
    },
    parallaxMode: {
      value: 'POM',
      options: ['POM', 'Basic Displacement'],
      label: 'Parallax Mode',
    },
    parallaxIntensity: { value: 0.1, min: 0, max: 1, step: 0.01 },
    mouseSensitivity: { value: 0.3, min: 0, max: 1, step: 0.01 },
    scrollSensitivity: { value: 0.5, min: 0, max: 2, step: 0.1 },
    depthInvert: { value: false },
  }, { collapsed: true })

  const selectedImageData = AVAILABLE_IMAGES.find(img => img.name === selectedImage) || AVAILABLE_IMAGES[0]

  const imageTexture = useTexture(selectedImageData.image)
  const depthMapTexture = useTexture(selectedImageData.depth)

  useEffect(() => {
    if (imageTexture) {
      imageTexture.flipY = true
      imageTexture.needsUpdate = true
    }
    if (depthMapTexture) {
      depthMapTexture.format = THREE.RedFormat
      depthMapTexture.colorSpace = THREE.LinearSRGBColorSpace
      depthMapTexture.flipY = true
      depthMapTexture.needsUpdate = true
    }
  }, [imageTexture, depthMapTexture])

  const aspectRatio = imageTexture?.image
    ? imageTexture.image.width / imageTexture.image.height
    : 1

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = 1 - (e.clientY / window.innerHeight) * 2
      mouseOffsetRef.current.set(x * mouseSensitivity, y * mouseSensitivity)
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseSensitivity])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const normalized = maxScroll > 0 ? scrollY / maxScroll : 0
      const offsetY = (normalized - 0.5) * 2
      scrollOffsetRef.current.set(0, offsetY * scrollSensitivity)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollSensitivity])

  const geometry = useMemo(() => {
    const height = viewport.height * 0.9
    const width = height * aspectRatio
    return new THREE.PlaneGeometry(width, height)
  }, [viewport.height, aspectRatio])

  const material = useMemo(() => {
    if (!imageTexture || !depthMapTexture) return null

    // Select fragment shader based on mode
    const fragmentShader = parallaxMode === 'POM'
      ? pomFragmentShader
      : basicDisplacementFragmentShader

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        imageTexture: { value: imageTexture },
        depthMap: { value: depthMapTexture },
        parallaxIntensity: { value: parallaxIntensity },
        mouseOffset: { value: mouseOffsetUniform.current },
        scrollOffset: { value: scrollOffsetUniform.current },
        depthInvert: { value: depthInvert ? 1.0 : 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: fragmentShader,
    })

    materialRef.current = mat
    return mat
  }, [imageTexture, depthMapTexture, parallaxIntensity, depthInvert, parallaxMode])

  useFrame(() => {
    // Update the uniform Vector2s directly (these are the same objects referenced in the material)
    mouseOffsetUniform.current.set(mouseOffsetRef.current.x, mouseOffsetRef.current.y)
    scrollOffsetUniform.current.set(scrollOffsetRef.current.x, scrollOffsetRef.current.y)

    if (materialRef.current?.uniforms) {
      materialRef.current.uniforms.parallaxIntensity.value = parallaxIntensity
      materialRef.current.uniforms.depthInvert.value = depthInvert ? 1.0 : 0.0
    }
  })

  if (!material) return null

  return <mesh geometry={geometry} material={material} />
}
