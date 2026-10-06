/**
 * CapstoneTrack — 3D Scroll Keyframes Configuration
 * Maps normalized scroll progress (0.0 to 1.0) to 3D object transforms and colors.
 */

export const KEYFRAMES = [
  // 1. Hero (0.00 - 0.15)
  {
    progress: 0.0,
    position: [0, 0.1, 0],
    rotation: [0.25, -0.2, 0],
    scale: [1, 1, 1],
    color: '#8F75FF', // Soft lavender/violet
    split: 0.0,
    activeSection: 0,
  },
  {
    progress: 0.15,
    position: [0, 0.15, 0],
    rotation: [0.3, 0.15, 0],
    scale: [1, 1, 1],
    color: '#8F75FF',
    split: 0.0,
    activeSection: 0,
  },
  // 2. Problem (0.16 - 0.32): Drifts left, squashes, stressed coral
  {
    progress: 0.25,
    position: [-1.9, -0.1, 0],
    rotation: [0.4, -0.6, -0.25],
    scale: [0.85, 0.72, 0.85], // squashed
    color: '#FFAAA6', // Stressed coral
    split: 0.0,
    activeSection: 1,
  },
  // 3. Solution (0.33 - 0.48): Returns center, rotates, soothing mint
  {
    progress: 0.40,
    position: [0, 0.2, 0],
    rotation: [0.2, Math.PI * 1.1, 0], // rotated yaw to show side
    scale: [1.05, 1.05, 1.05],
    color: '#A8EDDC', // Calming pastel mint
    split: 0.0,
    activeSection: 2,
  },
  // 4. How It Works (0.49 - 0.65): Rotates step per label with squash-stretch bounce
  {
    progress: 0.57,
    position: [0, 0.05, 0],
    rotation: [0.35, Math.PI * 1.8, 0.1],
    scale: [1.0, 1.08, 1.0],
    color: '#BAE6FD', // Pastel baby blue
    split: 0.0,
    activeSection: 3,
  },
  // 5. Stats Strip (0.66 - 0.78): Floats above center, pastel peach
  {
    progress: 0.72,
    position: [0, 0.75, -0.4],
    rotation: [0.15, Math.PI * 2.2, 0],
    scale: [0.92, 0.92, 0.92],
    color: '#FED7AA', // Pastel peach
    split: 0.0,
    activeSection: 4,
  },
  // 6. Roles Orbit (0.79 - 0.90): Splits into 4 orbiting clay blobs and merges
  {
    progress: 0.84,
    position: [0, 0.1, 0],
    rotation: [0.2, Math.PI * 2.8, 0],
    scale: [0.85, 0.85, 0.85],
    color: '#E4DCFF',
    split: 1.0, // Full orbit split
    activeSection: 5,
  },
  // 7. Final CTA (0.91 - 1.00): Scales up with happy bounce in accent violet
  {
    progress: 1.0,
    position: [0, 0.25, 0.2],
    rotation: [0.2, Math.PI * 3.0, 0],
    scale: [1.22, 1.22, 1.22],
    color: '#6C47FF', // Vibrant brand accent
    split: 0.0,
    activeSection: 6,
  },
];

// Linear interpolation helper
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Color hex interpolation helper
function lerpColor(c1, c2, t) {
  const parseHex = (hex) => {
    const clean = hex.replace('#', '');
    return [
      parseInt(clean.substring(0, 2), 16),
      parseInt(clean.substring(2, 4), 16),
      parseInt(clean.substring(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parseHex(c1);
  const [r2, g2, b2] = parseHex(c2);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Returns interpolated 3D object state for a given scroll progress [0, 1].
 */
export function getInterpolatedState(progress) {
  const p = Math.max(0, Math.min(1, progress));

  // Find surrounding keyframe segments
  let prev = KEYFRAMES[0];
  let next = KEYFRAMES[KEYFRAMES.length - 1];

  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (p >= KEYFRAMES[i].progress && p <= KEYFRAMES[i + 1].progress) {
      prev = KEYFRAMES[i];
      next = KEYFRAMES[i + 1];
      break;
    }
  }

  const span = next.progress - prev.progress;
  const factor = span === 0 ? 0 : (p - prev.progress) / span;

  return {
    position: [
      lerp(prev.position[0], next.position[0], factor),
      lerp(prev.position[1], next.position[1], factor),
      lerp(prev.position[2], next.position[2], factor),
    ],
    rotation: [
      lerp(prev.rotation[0], next.rotation[0], factor),
      lerp(prev.rotation[1], next.rotation[1], factor),
      lerp(prev.rotation[2], next.rotation[2], factor),
    ],
    scale: [
      lerp(prev.scale[0], next.scale[0], factor),
      lerp(prev.scale[1], next.scale[1], factor),
      lerp(prev.scale[2], next.scale[2], factor),
    ],
    color: lerpColor(prev.color, next.color, factor),
    split: lerp(prev.split, next.split, factor),
    activeSection: p < 0.16 ? 0 : p < 0.33 ? 1 : p < 0.49 ? 2 : p < 0.66 ? 3 : p < 0.79 ? 4 : p < 0.91 ? 5 : 6,
  };
}
