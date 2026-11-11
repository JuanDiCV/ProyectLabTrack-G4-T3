import { Component, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Fondo 3D EXCLUSIVAMENTE DECORATIVO (pantalla de login).
 * - Simula una red de nodos conectados + figuras geométricas de laboratorio.
 * - pointer-events: none → nunca intercepta clics de Selenium ni del usuario.
 * - La interacción (parallax) se obtiene escuchando el puntero en window.
 * - Ninguna lógica funcional vive dentro del canvas.
 */

const NODE_COUNT = 90;
const BOUNDS = 6;
const LINK_DISTANCE = 1.9;
const MAX_SEGMENTS = NODE_COUNT * 10;

type Pointer = { x: number; y: number };

function usePointer() {
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -((event.clientY / window.innerHeight) * 2 - 1),
      };
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  return pointer;
}

function createNodes(): { positions: Float32Array; velocities: Float32Array } {
  const positions = new Float32Array(NODE_COUNT * 3);
  const velocities = new Float32Array(NODE_COUNT * 3);
  for (let i = 0; i < positions.length; i += 1) {
    positions[i] = (Math.random() * 2 - 1) * BOUNDS;
    velocities[i] = (Math.random() * 2 - 1) * 0.25;
  }
  return { positions, velocities };
}

function moveNodes(positions: Float32Array, velocities: Float32Array, delta: number): void {
  for (let i = 0; i < positions.length; i += 1) {
    positions[i] += velocities[i] * delta;
    if (Math.abs(positions[i]) > BOUNDS) {
      velocities[i] *= -1;
    }
  }
}

function distanceSq(positions: Float32Array, a: number, b: number): number {
  const dx = positions[a * 3] - positions[b * 3];
  const dy = positions[a * 3 + 1] - positions[b * 3 + 1];
  const dz = positions[a * 3 + 2] - positions[b * 3 + 2];
  return dx * dx + dy * dy + dz * dz;
}

/** Rellena el buffer de segmentos con los pares de nodos cercanos; devuelve cuántos segmentos hay. */
function buildLinks(positions: Float32Array, segments: Float32Array): number {
  const maxSq = LINK_DISTANCE * LINK_DISTANCE;
  let count = 0;
  for (let a = 0; a < NODE_COUNT && count < MAX_SEGMENTS; a += 1) {
    for (let b = a + 1; b < NODE_COUNT && count < MAX_SEGMENTS; b += 1) {
      if (distanceSq(positions, a, b) < maxSq) {
        segments.set(positions.subarray(a * 3, a * 3 + 3), count * 6);
        segments.set(positions.subarray(b * 3, b * 3 + 3), count * 6 + 3);
        count += 1;
      }
    }
  }
  return count;
}

function NetworkGraph({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pointsGeometry = useRef<THREE.BufferGeometry>(null);
  const linesGeometry = useRef<THREE.BufferGeometry>(null);
  const pointer = usePointer();
  const { positions, velocities } = useMemo(createNodes, []);
  const segments = useMemo(() => new Float32Array(MAX_SEGMENTS * 6), []);

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    if (animate) moveNodes(positions, velocities, step);
    const linkCount = buildLinks(positions, segments);
    const pointAttribute = pointsGeometry.current?.attributes.position;
    if (pointAttribute) pointAttribute.needsUpdate = true;
    if (linesGeometry.current) {
      linesGeometry.current.setDrawRange(0, linkCount * 2);
      linesGeometry.current.attributes.position.needsUpdate = true;
    }
    if (group.current) {
      group.current.rotation.y += step * 0.05;
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, pointer.current.y * 0.25, 0.04);
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, pointer.current.x * 0.6, 0.04);
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry ref={pointsGeometry}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffc21f" size={0.09} sizeAttenuation transparent opacity={0.9} />
      </points>
      <lineSegments>
        <bufferGeometry ref={linesGeometry}>
          <bufferAttribute attach="attributes-position" args={[segments, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#9a9a9a" transparent opacity={0.28} />
      </lineSegments>
    </group>
  );
}

interface FloatingShapeProps {
  position: [number, number, number];
  color: string;
  speed: number;
  children: ReactNode;
}

function FloatingShape({ position, color, speed, children }: FloatingShapeProps) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime() * speed;
    mesh.current.rotation.x = t * 0.6;
    mesh.current.rotation.y = t;
    mesh.current.position.y = position[1] + Math.sin(t) * 0.3;
  });
  return (
    <mesh ref={mesh} position={position}>
      {children}
      <meshBasicMaterial color={color} wireframe transparent opacity={0.35} />
    </mesh>
  );
}

/** Si WebGL no está disponible (p. ej. algunos navegadores headless), se muestra solo el degradado. */
class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function NetworkBackground() {
  const animate = !prefersReducedMotion();
  return (
    <div
      aria-hidden="true"
      data-testid="bg-canvas"
      className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_#2b2000_0%,_#000000_65%)]"
    >
      <CanvasErrorBoundary>
        <Canvas camera={{ position: [0, 0, 9], fov: 60 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
          <NetworkGraph animate={animate} />
          <FloatingShape position={[-5, 2.5, -2]} color="#ffb800" speed={0.35}>
            <icosahedronGeometry args={[1.1, 0]} />
          </FloatingShape>
          <FloatingShape position={[5.2, -2.2, -3]} color="#bdbdbd" speed={0.25}>
            <torusKnotGeometry args={[0.8, 0.22, 90, 10]} />
          </FloatingShape>
          <FloatingShape position={[4.5, 3, -4]} color="#ffd04d" speed={0.3}>
            <octahedronGeometry args={[0.9, 0]} />
          </FloatingShape>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
