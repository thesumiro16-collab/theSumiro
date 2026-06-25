import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * FabricCanvas
 * A WebGL background that renders a flowing, silk-like surface using a
 * custom GLSL shader on a subdivided plane. Uses the brand saffron + cream
 * palette, reacts to the cursor, and gracefully disables motion when the
 * user prefers reduced motion.
 *
 * Designed to sit absolutely behind hero content (pointerEvents: 'none'
 * applied via the host element).
 */
export default function FabricCanvas({ style, className }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Renderer ─────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // transparent — we sit on a CSS gradient
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    // ── Scene & camera ───────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.2);
    camera.lookAt(0, 0, 0);

    // ── Geometry: a high-res plane (the "silk sheet") ────────
    const geometry = new THREE.PlaneGeometry(8, 5, 160, 100);

    // ── Shader material ──────────────────────────────────────
    const uniforms = {
      uTime:        { value: 0 },
      uMouse:       { value: new THREE.Vector2(0, 0) },
      uMouseStrength: { value: 0 },
      uColorWarm:   { value: new THREE.Color('#E8890C') }, // saffron
      uColorLight:  { value: new THREE.Color('#FDF3E3') }, // cream
      uColorBase:   { value: new THREE.Color('#FFFFFF') }, // white
      uColorAccent: { value: new THREE.Color('#F5C97A') }, // soft gold
    };

    const vertexShader = /* glsl */ `
      uniform float uTime;
      uniform vec2  uMouse;
      uniform float uMouseStrength;

      varying vec2  vUv;
      varying float vWave;
      varying vec3  vNormal;

      // 2D simplex-like noise (cheap, smooth)
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vUv = uv;

        vec3 pos = position;
        float t = uTime * 0.55;

        // Layered waves — gives the silk a flowing, draped feel
        float w1 = sin(pos.x * 1.2 + t * 1.4) * 0.18;
        float w2 = sin(pos.y * 1.6 - t * 1.1) * 0.14;
        float w3 = sin((pos.x + pos.y) * 0.9 + t * 0.8) * 0.10;
        float n  = noise(pos.xy * 0.6 + t * 0.3) * 0.18;

        // Mouse-driven local lift (a soft hand "touching" the silk)
        vec2  toMouse = pos.xy - uMouse * vec2(4.0, 2.5);
        float dist    = length(toMouse);
        float lift    = exp(-dist * 1.4) * uMouseStrength * 0.55;

        float wave = w1 + w2 + w3 + n + lift;
        pos.z += wave;

        vWave   = wave;
        vNormal = normalize(vec3(-cos(pos.x * 1.2 + t) * 0.2, -cos(pos.y * 1.6 - t) * 0.2, 1.0));

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = /* glsl */ `
      uniform float uTime;
      uniform vec3  uColorWarm;
      uniform vec3  uColorLight;
      uniform vec3  uColorBase;
      uniform vec3  uColorAccent;

      varying vec2  vUv;
      varying float vWave;
      varying vec3  vNormal;

      void main() {
        // Vertical gradient from cream-white (top) to saffron-touched (bottom)
        vec3 grad = mix(uColorBase, uColorLight, smoothstep(0.0, 0.7, vUv.y));
        grad      = mix(grad, uColorAccent, smoothstep(0.6, 1.0, 1.0 - vUv.y) * 0.55);

        // Wave-driven highlights (silk shimmer)
        float shimmer = smoothstep(0.05, 0.32, vWave);
        grad = mix(grad, uColorWarm, shimmer * 0.35);

        // Soft rim lighting based on faux normal
        float rim = pow(1.0 - clamp(vNormal.z, 0.0, 1.0), 1.6);
        grad += uColorWarm * rim * 0.18;

        // Subtle moving sheen band
        float sheen = smoothstep(0.48, 0.5, sin(vUv.x * 6.0 + uTime * 0.6) * 0.5 + 0.5);
        grad += vec3(sheen) * 0.04;

        // Vignette toward edges so it blends with the page
        float vignette = smoothstep(1.1, 0.35, length(vUv - 0.5));
        float alpha    = 0.78 * vignette;

        gl_FragColor = vec4(grad, alpha);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -0.55; // tilted, draped perspective
    mesh.rotation.z = 0.15;
    scene.add(mesh);

    // ── Resize handling ──────────────────────────────────────
    const setSize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    setSize();

    const ro = new ResizeObserver(setSize);
    ro.observe(mount);

    // ── Mouse parallax ───────────────────────────────────────
    const targetMouse = new THREE.Vector2(0, 0);
    const onMove = (e) => {
      const rect = mount.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const y = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
      targetMouse.set(x, -y);
      uniforms.uMouseStrength.value = 1.0;
    };
    const onLeave = () => { uniforms.uMouseStrength.value = 0; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    // ── Animation loop ───────────────────────────────────────
    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;

    const tick = () => {
      if (!running) return;
      const dt = clock.getDelta();
      uniforms.uTime.value += prefersReduced ? 0 : dt;

      // Smooth mouse follow
      uniforms.uMouse.value.lerp(targetMouse, 0.06);
      uniforms.uMouseStrength.value *= 0.985;

      // Gentle idle breathing rotation
      if (!prefersReduced) {
        mesh.rotation.z = 0.15 + Math.sin(uniforms.uTime.value * 0.25) * 0.02;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    // Pause when tab is hidden — saves battery and CPU
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        clock.getDelta(); // discard accumulated time
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    tick();

    // ── Cleanup ──────────────────────────────────────────────
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
