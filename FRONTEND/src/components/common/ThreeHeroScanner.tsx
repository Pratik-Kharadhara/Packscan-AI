import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getSafeWebGLContext } from '../../lib/webgl';

export const ThreeHeroScanner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    const canvas = document.createElement('canvas');
    const gl = getSafeWebGLContext(canvas);

    if (!gl) {
      setHasWebGL(false);
      return;
    }

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.2, 2.4, 3.8);
    camera.lookAt(0, 0, 0);

    // 2. Renderer
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: gl,
        alpha: true,
        antialias: true,
        powerPreference: 'default',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(canvas);
    } catch {
      setHasWebGL(false);
      return;
    }

    // 3. Packaging Box Mesh (Stylized Matte Package with Wireframe Edges)
    const boxGroup = new THREE.Group();
    scene.add(boxGroup);

    // Package Body
    const boxGeo = new THREE.BoxGeometry(1.6, 2.2, 0.9);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // slate-800
      roughness: 0.25,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92,
    });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxGroup.add(boxMesh);

    // Wireframe Outline for High-Tech OCR Look
    const wireGeo = new THREE.WireframeGeometry(boxGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x22c55e, // emerald-500
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    boxGroup.add(wireMesh);

    // Simulated OCR Bounding Label Plane on Front Face
    const labelGeo = new THREE.PlaneGeometry(1.2, 1.6);
    const labelMat = new THREE.MeshBasicMaterial({
      color: 0x166534, // emerald-800
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.set(0, 0, 0.46);
    boxGroup.add(labelMesh);

    // 4. Scanning Laser Plane (Moving up and down)
    const laserGeo = new THREE.PlaneGeometry(2.4, 0.05);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80, // emerald-400
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    laserMesh.rotation.x = Math.PI / 2;
    scene.add(laserMesh);

    // 5. Floating Ambient Particle Points
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 5;
      particlePositions[i + 1] = (Math.random() - 0.5) * 4;
      particlePositions[i + 2] = (Math.random() - 0.5) * 5;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x22c55e,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x86efac, 2.2);
    dirLight.position.set(4, 5, 3);
    scene.add(dirLight);

    const bluePoint = new THREE.PointLight(0x38bdf8, 2.0, 8);
    bluePoint.position.set(-2, -1, 2);
    scene.add(bluePoint);

    // 7. Mouse Tilt Interaction
    let targetRotY = 0;
    let targetRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 0.7;
      targetRotX = y * 0.4;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 8. Animation Loop
    let animId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth idle rotation + mouse reactivity
      boxGroup.rotation.y += (targetRotY + Math.sin(elapsed * 0.5) * 0.25 - boxGroup.rotation.y) * 0.05;
      boxGroup.rotation.x += (targetRotX - boxGroup.rotation.x) * 0.05;

      // Laser oscillation (-1.1 to 1.1)
      laserMesh.position.y = Math.sin(elapsed * 2.2) * 1.15;
      laserMesh.rotation.y = boxGroup.rotation.y;

      // Subtle particle floating
      particles.rotation.y = elapsed * 0.04;

      if (renderer) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // 9. Resize handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (renderer && canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
        renderer.dispose();
      }

      boxGeo.dispose();
      boxMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      labelGeo.dispose();
      labelMat.dispose();
      laserGeo.dispose();
      laserMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[320px] sm:h-[380px] flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#F7F8F5] to-[#E5E7EB]/50 border border-[#D1D5DB] overflow-hidden"
    >
      {/* Laser Scanning Line Indicator Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-xs border border-[#D1D5DB] text-[10px] font-mono text-[#166534]">
        <span className="w-2 h-2 rounded-full bg-[#166534] animate-ping" />
        <span>3D PACKAGE SCANNER • LIVE</span>
      </div>

      <div className="absolute bottom-3 right-3 z-10 text-[10px] font-mono text-[#6B7280]">
        Interactive 3D Viewport
      </div>

      {!hasWebGL && (
        <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-[#6B7280]">
          <div className="w-16 h-20 rounded-lg bg-[#1E293B] border border-[#22C55E]/40 shadow-inner flex items-center justify-center text-white font-mono font-bold mb-2">
            OCR
          </div>
          <span>3D Packaging Scanner Visualizer</span>
        </div>
      )}
    </div>
  );
};
