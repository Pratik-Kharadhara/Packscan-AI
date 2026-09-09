import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeHeroSceneProps {
  className?: string;
}

export const ThreeHeroScene: React.FC<ThreeHeroSceneProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    // Dimensions
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();

    // Camera (Isometric-angled perspective)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(6.5, 4.8, 7.5);
    camera.lookAt(0, 0.2, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xdcfce7, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 10, 6);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x86efac, 0.8);
    fillLight.position.set(-6, -2, -4);
    scene.add(fillLight);

    const greenPointLight = new THREE.PointLight(0x65a30d, 3, 10);
    greenPointLight.position.set(0, 1.5, 2.5);
    scene.add(greenPointLight);

    // Parent group for package assembly
    const packageGroup = new THREE.Group();
    scene.add(packageGroup);

    // 1. Base Package Geometry (Matte Carton / Package)
    const boxGeo = new THREE.BoxGeometry(2.4, 3.2, 1.6);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x1f3d2b,
      roughness: 0.65,
      metalness: 0.1,
    });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.position.y = 0.4;
    packageGroup.add(boxMesh);

    // Edges outline for architectural precision
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x65a30d, transparent: true, opacity: 0.6 });
    const edgesLine = new THREE.LineSegments(edgesGeo, edgesMat);
    edgesLine.position.y = 0.4;
    packageGroup.add(edgesLine);

    // 2. White Label Panel on Front Face (Rule 6 Principal Display Panel)
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 512;
    const ctx = labelCanvas.getContext('2d');
    if (ctx) {
      // Off-white card label background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 512);

      // Top Header bar in Forest Green (#166534)
      ctx.fillStyle = '#166534';
      ctx.fillRect(0, 0, 512, 52);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillText('LEGAL METROLOGY PCR 2011', 28, 35);

      // Commodity Title
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 30px Inter, sans-serif';
      ctx.fillText('ORGANIC ROLLED OATS', 28, 105);

      // Subtitle
      ctx.fillStyle = '#4B5563';
      ctx.font = '500 18px Inter, sans-serif';
      ctx.fillText('Mfd By: PurePack Foods Pvt. Ltd.', 28, 140);
      ctx.fillText('Sector 14, Gurugram, Haryana 122001', 28, 168);

      // Divider line
      ctx.fillStyle = '#D1D5DB';
      ctx.fillRect(28, 192, 456, 3);

      // Key Declarations
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText('NET QUANTITY: 500 g', 28, 240);
      ctx.fillText('MRP: ₹ 165.00', 28, 282);
      ctx.font = '500 16px Inter, sans-serif';
      ctx.fillStyle = '#4B5563';
      ctx.fillText('(Inclusive of all taxes)', 205, 282);

      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillStyle = '#1F2937';
      ctx.fillText('MFD DATE: 04 / 2026', 28, 330);
      ctx.fillText('CONSUMER CARE: 1800-209-4455', 28, 370);

      // Barcode lines at bottom
      ctx.fillStyle = '#111827';
      const startX = 28;
      const barY = 415;
      const barH = 50;
      const barPattern = [3, 2, 4, 1, 5, 2, 2, 4, 3, 2, 5, 3, 2, 4, 2, 5, 1, 3, 4, 2, 5, 3];
      let curX = startX;
      barPattern.forEach((w, i) => {
        if (i % 2 === 0) {
          ctx.fillRect(curX, barY, w * 3.5, barH);
        }
        curX += w * 5;
      });

      // Green Compliance Verification Stamp
      ctx.beginPath();
      ctx.arc(430, 310, 36, 0, Math.PI * 2);
      ctx.fillStyle = '#F0FDF4';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#166534';
      ctx.stroke();

      // Checkmark inside stamp
      ctx.beginPath();
      ctx.moveTo(418, 310);
      ctx.lineTo(426, 318);
      ctx.lineTo(444, 300);
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = '#166534';
      ctx.stroke();
    }

    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelGeo = new THREE.PlaneGeometry(2.0, 2.7);
    const labelMat = new THREE.MeshStandardMaterial({
      map: labelTexture,
      roughness: 0.4,
      metalness: 0.05,
    });
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.set(0, 0.4, 0.805); // Just in front of the box
    packageGroup.add(labelMesh);

    // 3. Scanning Laser Beam & Slice Plane
    const laserPlaneGeo = new THREE.PlaneGeometry(3.6, 2.6);
    const laserPlaneMat = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const laserPlane = new THREE.Mesh(laserPlaneGeo, laserPlaneMat);
    laserPlane.rotation.x = Math.PI / 2;
    laserPlane.position.y = 0.4;
    packageGroup.add(laserPlane);

    // Glowing Laser Line Ring around the package contour
    const laserRingGeo = new THREE.BufferGeometry();
    const halfW = 1.22;
    const halfD = 0.82;
    const ringPoints = new Float32Array([
      -halfW, 0, -halfD,
       halfW, 0, -halfD,
       halfW, 0,  halfD,
      -halfW, 0,  halfD,
      -halfW, 0, -halfD,
    ]);
    laserRingGeo.setAttribute('position', new THREE.BufferAttribute(ringPoints, 3));
    const laserRingMat = new THREE.LineBasicMaterial({ color: 0xa3e635, linewidth: 3 });
    const laserRing = new THREE.Line(laserRingGeo, laserRingMat);
    laserRing.position.y = 0.4;
    packageGroup.add(laserRing);

    // 4. Bounding Box Corners (Holographic Spatial Detection Markers)
    const cornersGroup = new THREE.Group();
    packageGroup.add(cornersGroup);

    const cornerMat = new THREE.LineBasicMaterial({ color: 0x4ade80 });
    const createCornerBracket = (x: number, y: number, z: number, dirX: number, dirY: number) => {
      const pts = [
        new THREE.Vector3(x + dirX * 0.25, y, z),
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x, y + dirY * 0.25, z),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      return new THREE.Line(geo, cornerMat);
    };

    // 4 corners around MRP / Net Qty region
    cornersGroup.add(createCornerBracket(-0.95, 0.85, 0.85, 1, -1));
    cornersGroup.add(createCornerBracket(0.95, 0.85, 0.85, -1, -1));
    cornersGroup.add(createCornerBracket(-0.95, -0.25, 0.85, 1, 1));
    cornersGroup.add(createCornerBracket(0.95, -0.25, 0.85, -1, 1));

    // 5. Circular Inspection Stage Grid on Ground
    const gridHelper = new THREE.GridHelper(7, 14, 0x166534, 0x14532d);
    gridHelper.position.y = -1.25;
    scene.add(gridHelper);

    // Concentric Calibration Rings
    const ringGeo = new THREE.RingGeometry(2.2, 2.23, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x65a30d, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
    const groundRing = new THREE.Mesh(ringGeo, ringMat);
    groundRing.rotation.x = Math.PI / 2;
    groundRing.position.y = -1.24;
    scene.add(groundRing);

    // Subtle Particle Dots in 3D Space
    const particlesCount = 45;
    const particlePositions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 8;
      particlePositions[i + 1] = Math.random() * 4 - 0.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 8;
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0x86efac,
      size: 0.05,
      transparent: true,
      opacity: 0.65,
    });
    const particlePoints = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlePoints);

    // Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x * 0.35;
      mouseY = y * 0.25;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Subtle restrained rotation
        packageGroup.rotation.y += 0.0035;

        // Smooth mouse parallax interpolation
        targetRotY += (mouseX - targetRotY) * 0.05;
        targetRotX += (mouseY - targetRotX) * 0.05;
        camera.position.x = 6.5 + targetRotY * 1.5;
        camera.position.y = 4.8 + targetRotX * 1.0;
        camera.lookAt(0, 0.2, 0);

        // Laser Scan oscillation (smooth sinusoidal up/down)
        const laserY = Math.sin(elapsedTime * 1.8) * 1.25 + 0.4;
        laserPlane.position.y = laserY;
        laserRing.position.y = laserY;

        // Subtle pulsing for point light
        greenPointLight.intensity = 2.5 + Math.sin(elapsedTime * 3) * 0.8;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      mediaQuery.removeEventListener('change', handleMotionChange);
      resizeObserver.disconnect();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose resources
      boxGeo.dispose();
      boxMat.dispose();
      edgesGeo.dispose();
      edgesMat.dispose();
      labelGeo.dispose();
      labelMat.dispose();
      labelTexture.dispose();
      laserPlaneGeo.dispose();
      laserPlaneMat.dispose();
      laserRingGeo.dispose();
      laserRingMat.dispose();
      gridHelper.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
      aria-label="3D Package Optical Inspection Visualization"
    />
  );
};
