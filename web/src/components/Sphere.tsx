"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// The dotted globe from the reference: a Fibonacci sphere of points with a
// slow spin and a brighter band sweeping across it, like a scan.
function Dots({ count = 2600, color = "#f3f3f0", band = true }: { count?: number; color?: string; band?: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * r;
      ph[i] = Math.random();
    }
    return { positions: pos, phases: ph };
  }, [count]);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("phase", new THREE.BufferAttribute(phases, 1));
    return g;
  }, [positions, phases]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uBand: { value: band ? 1 : 0 },
        },
        vertexShader: `
          attribute float phase;
          uniform float uTime;
          uniform float uBand;
          varying float vA;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float facing = normalize((modelViewMatrix * vec4(position, 0.0)).xyz).z;
            float sweep = sin(position.x * 3.0 + position.y * 2.0 + uTime * 0.9);
            float bandA = uBand * smoothstep(0.75, 1.0, sweep);
            vA = (0.25 + 0.75 * smoothstep(-0.2, 0.9, facing)) * (0.55 + 0.45 * bandA);
            gl_PointSize = (1.6 + 1.8 * bandA) * (300.0 / -mv.z) * 0.012;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying float vA;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            if (dot(c, c) > 0.25) discard;
            gl_FragColor = vec4(uColor, vA);
          }
        `,
      }),
    [color, band],
  );

  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.18;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}

export function Sphere({ className = "", color, count }: { className?: string; color?: string; count?: number }) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 2.6], fov: 40 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
        <Dots color={color} count={count} />
      </Canvas>
    </div>
  );
}
