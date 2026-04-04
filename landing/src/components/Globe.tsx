import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

// Atmosphere Shader
const AtmosphereShader = {
  uniforms: {
    uColor: { value: new THREE.Color('#ffdbcc') },
    uCoefficient: { value: 0.1 },
    uPower: { value: 4.0 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vEyeVector;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vEyeVector = -vec3(mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uCoefficient;
    uniform float uPower;
    varying vec3 vNormal;
    varying vec3 vEyeVector;
    void main() {
      float intensity = pow(uCoefficient + dot(vNormal, normalize(vEyeVector)), uPower);
      gl_FragColor = vec4(uColor, intensity);
    }
  `,
};

export function Globe({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const globeRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  
  // Load Earth Textures
  const [colorMap, bumpMap] = useTexture([
    'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-dark.jpg',
    'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-topology.png',
  ]);

  // Generate Observation Points
  const pointCount = 1500;
  const points = useMemo(() => {
    const p = [];
    
    // Define some "active clusters" (hotspots)
    const clusters = [
      { pos: new THREE.Vector3(1, 0.5, 1).normalize(), radius: 0.4 },
      { pos: new THREE.Vector3(-1, -0.2, 0.5).normalize(), radius: 0.3 },
      { pos: new THREE.Vector3(0.2, 0.8, -1).normalize(), radius: 0.5 },
      { pos: new THREE.Vector3(-0.5, 0.3, -1).normalize(), radius: 0.35 },
    ];

    for (let i = 0; i < pointCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / pointCount);
      const theta = Math.sqrt(pointCount * Math.PI) * phi;
      
      const x = Math.cos(theta) * Math.sin(phi);
      const y = Math.sin(theta) * Math.sin(phi);
      const z = Math.cos(phi);
      
      const pos = new THREE.Vector3(x, y, z);
      
      // Check if point is in a cluster
      let inCluster = false;
      let clusterIntensity = 0;
      for (const cluster of clusters) {
        const dist = pos.distanceTo(cluster.pos);
        if (dist < cluster.radius) {
          inCluster = true;
          clusterIntensity = 1 - (dist / cluster.radius);
          break;
        }
      }

      p.push({ 
        pos: pos.clone().multiplyScalar(2.02),
        scale: (inCluster ? 0.012 : 0.006) + Math.random() * 0.005,
        active: inCluster,
        intensity: clusterIntensity
      });
    }
    return p;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (globeRef.current) {
      // Slower, more premium rotation
      globeRef.current.rotation.y = time * 0.03 + (scrollProgress * 0.5);
    }
  });

  return (
    <group ref={globeRef}>
      {/* Earth Sphere */}
      <Sphere ref={earthRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.08}
          roughness={0.8}
          metalness={0.1}
          color="#333" // Darker base for more depth
        />
      </Sphere>

      {/* Observation Points */}
      <Instances range={pointCount}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial transparent opacity={0.6} color="#ffdbcc" />
        {points.map((p, i) => (
          <PointInstance key={i} {...p} scrollProgress={scrollProgress} />
        ))}
      </Instances>

      {/* Atmosphere Glow */}
      <Sphere args={[2.2, 64, 64]}>
        <shaderMaterial
          attach="material"
          {...AtmosphereShader}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>

      {/* Refined Lighting */}
      <pointLight position={[5, 5, 5]} intensity={1} color="#ffdbcc" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#914111" />
      <ambientLight intensity={0.15} />
    </group>
  );
}

function PointInstance({ pos, scale, active, intensity, scrollProgress }: { 
  pos: THREE.Vector3, 
  scale: number, 
  active: boolean, 
  intensity: number,
  scrollProgress: number 
}) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      
      // Base pulse
      let s = scale;
      if (active) {
        s *= (1 + Math.sin(t * 1.5 + pos.x * 5) * 0.2 * intensity);
      }
      
      // Scroll-linked density/glow effect
      const scrollEffect = Math.max(0, scrollProgress * 1.5);
      if (active) {
        s *= (1 + scrollEffect * 0.5);
      } else {
        // Subtle increase in non-active points too
        s *= (1 + scrollEffect * 0.1);
      }

      ref.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={ref} position={pos} scale={scale}>
      <Instance 
        color={active ? "#ffdbcc" : "#914111"} 
        // We can't easily change instance opacity per item without custom shaders, 
        // but we can change color brightness.
      />
    </group>
  );
}


