import * as THREE from 'three';

/**
 * Safely checks and obtains a WebGL context without triggering uncaught console errors.
 */
export function getSafeWebGLContext(
  canvas: HTMLCanvasElement
): WebGLRenderingContext | WebGL2RenderingContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const opts: WebGLContextAttributes = {
      alpha: true,
      antialias: false,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false,
      preserveDrawingBuffer: false,
    };

    const gl =
      canvas.getContext('webgl2', opts) ||
      canvas.getContext('webgl', opts) ||
      (canvas.getContext('experimental-webgl', opts) as WebGLRenderingContext | null);

    return (gl as WebGLRenderingContext | WebGL2RenderingContext) || null;
  } catch {
    return null;
  }
}

/**
 * Attempts to instantiate a Three.js WebGLRenderer with fallback suppression.
 */
export function createSafeWebGLRenderer(
  container: HTMLElement
): THREE.WebGLRenderer | null {
  if (typeof window === 'undefined') return null;

  try {
    const canvas = document.createElement('canvas');
    const gl = getSafeWebGLContext(canvas);

    if (!gl) {
      return null;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      context: gl,
      alpha: true,
      antialias: false,
      powerPreference: 'default',
    });

    container.appendChild(canvas);
    return renderer;
  } catch {
    return null;
  }
}
