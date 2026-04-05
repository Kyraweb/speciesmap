import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';

// Atmosphere Shader
const AtmosphereShader = {
  uniforms: {
    uColor: { value: new THREE.Color('#f3d8c4') },
    uCoefficient: { value: 0.18 },
    uPower: { value: 3.3 },
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
  const [colorMap, bumpMap] = useTexture([
    '/textures/earth.jpg',
    '/textures/earth-normal.jpg',
  ]);

  useEffect(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.needsUpdate = true;
    bumpMap.colorSpace = THREE.NoColorSpace;
    bumpMap.needsUpdate = true;
  }, [bumpMap, colorMap]);

  const pointCount = 1500;
  const points = useMemo(() => {
    const p = [];

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
      globeRef.current.rotation.y = time * 0.03 + (scrollProgress * 0.5);
    }
  });

  return (
    <group ref={globeRef}>
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.03}
          color="#f6f0e8"
          metalness={0.03}
          roughness={0.78}
          envMapIntensity={0.55}
        />
      </Sphere>

      <Instances range={pointCount}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial transparent opacity={0.7} color="#f5d9c7" />
        {points.map((p, i) => (
          <PointInstance key={i} {...p} scrollProgress={scrollProgress} />
        ))}
      </Instances>

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

      let s = scale;
      if (active) {
        s *= (1 + Math.sin(t * 1.5 + pos.x * 5) * 0.2 * intensity);
      }

      const scrollEffect = Math.max(0, scrollProgress * 1.5);
      if (active) {
        s *= (1 + scrollEffect * 0.5);
      } else {
        s *= (1 + scrollEffect * 0.1);
      }

      ref.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={ref} position={pos} scale={scale}>
      <Instance
        color={active ? '#f8dfcf' : '#be7a4e'}
      />
    </group>
  );
}

