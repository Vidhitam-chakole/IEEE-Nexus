import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import HeroObject from './HeroObject';

export default function HeroCanvas({ scrollProgress }) {
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const listener = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglAvailable(false);
    } catch (e) {
      setWebglAvailable(false);
    }

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Graceful 2D Clay Illustration Fallback
  if (!webglAvailable || reducedMotion) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.85,
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #A792FF 0%, #6C47FF 100%)',
            boxShadow: 'var(--shadow-clay-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '4.5rem',
          }}
        >
          🎓
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42 }}
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* Soft Ambient Light for Matte Clay */}
        <ambientLight intensity={1.1} />

        {/* Warm Key Directional Light */}
        <directionalLight position={[5, 8, 5]} intensity={1.4} color="#FFF8F0" />

        {/* Soft Violet/Lavender Fill Light */}
        <directionalLight position={[-5, -2, -2]} intensity={0.5} color="#D6CEFE" />

        {/* Persistent 3D Clay Hero Object */}
        <HeroObject scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
