import React from 'react';

/**
 * Official Symbiosis International University (SIU) Crest & Radiating Fan Logo
 * Features:
 * - The iconic radiating fan emblem with birds in flight
 * - Sacred Sanskrit motto: ॥ वसुधैव कुटुम्बकम् ॥ (Vasudhaiva Kutumbakam)
 * - Deep SIU Crimson Red & Regal Gold accents
 */
export default function SymbiosisLogo({ size = 42, showText = false, campus = 'Nagpur Campus', variant = 'colored' }) {
  const primaryColor = variant === 'white' ? '#FFFFFF' : 'var(--siu-red-primary, #990000)';
  const goldColor = 'var(--siu-gold, #D4AF37)';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
      {/* Vector Crest Emblem with Radiating Fan & Flying Birds */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 4px 10px rgba(153, 0, 0, 0.28))',
          flexShrink: 0,
        }}
      >
        <defs>
          <radialGradient id="siuRedGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#B30000" />
            <stop offset="100%" stopColor="#7A0000" />
          </radialGradient>
          <linearGradient id="siuGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D061" />
            <stop offset="100%" stopColor="#C49A24" />
          </linearGradient>
        </defs>

        {/* Circular Outer Seal */}
        <circle cx="50" cy="50" r="48" fill="url(#siuRedGlow)" stroke={goldColor} strokeWidth="2.5" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" strokeDasharray="2 2" />

        {/* Radiating Fan Ribs (The Iconic Symbiosis Fan) */}
        <path d="M 50 72 L 20 42 A 42 42 0 0 1 80 42 Z" fill="rgba(255, 255, 255, 0.08)" />
        
        {/* Fan Plumes / Ribs radiating from base */}
        <line x1="50" y1="70" x2="24" y2="44" stroke={goldColor} strokeWidth="1.2" opacity="0.85" />
        <line x1="50" y1="70" x2="33" y2="35" stroke={goldColor} strokeWidth="1.2" opacity="0.85" />
        <line x1="50" y1="70" x2="43" y2="30" stroke={goldColor} strokeWidth="1.2" opacity="0.85" />
        <line x1="50" y1="70" x2="50" y2="28" stroke={goldColor} strokeWidth="1.5" />
        <line x1="50" y1="70" x2="57" y2="30" stroke={goldColor} strokeWidth="1.2" opacity="0.85" />
        <line x1="50" y1="70" x2="67" y2="35" stroke={goldColor} strokeWidth="1.2" opacity="0.85" />
        <line x1="50" y1="70" x2="76" y2="44" stroke={goldColor} strokeWidth="1.2" opacity="0.85" />

        {/* Upper Radiating Fan Arc Petals (Japanese Fan / Feather Plumes) */}
        <path
          d="M 23 44 C 28 35, 36 28, 50 26 C 64 28, 72 35, 77 44 C 73 40, 64 34, 50 34 C 36 34, 27 40, 23 44 Z"
          fill="url(#siuGoldGrad)"
        />
        <path
          d="M 28 48 C 34 40, 41 35, 50 33 C 59 35, 66 40, 72 48 C 68 44, 60 39, 50 39 C 40 39, 32 44, 28 48 Z"
          fill="#FFFFFF"
          opacity="0.95"
        />

        {/* Central Rising Birds / Stylized Flight (Symbiosis Motif) */}
        {/* Lead Bird (Center Top) */}
        <path
          d="M 50 36 Q 47 41 42 42 Q 47 43 50 47 Q 53 43 58 42 Q 53 41 50 36 Z"
          fill="#FFFFFF"
        />
        {/* Left Wing Flying Bird */}
        <path
          d="M 37 46 Q 34 50 30 50 Q 34 52 37 54 Q 39 51 43 50 Q 40 49 37 46 Z"
          fill="url(#siuGoldGrad)"
        />
        {/* Right Wing Flying Bird */}
        <path
          d="M 63 46 Q 60 49 57 50 Q 61 51 63 54 Q 66 52 70 50 Q 66 50 63 46 Z"
          fill="url(#siuGoldGrad)"
        />

        {/* Stylized 'S' and Global Unity Base Arch */}
        <path
          d="M 38 64 C 42 60, 58 60, 62 64 C 58 68, 42 68, 38 64 Z"
          fill={goldColor}
        />
        <circle cx="50" cy="62" r="3" fill="#FFFFFF" />

        {/* Fan Handle / Base Pivot */}
        <circle cx="50" cy="72" r="4.5" fill="url(#siuGoldGrad)" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="50" cy="72" r="2" fill="#7A0000" />

        {/* Bottom Banner Ribbon with Devanagari Inscription */}
        <path
          d="M 20 82 Q 50 87 80 82 L 83 89 Q 50 94 17 89 Z"
          fill="#FFFFFF"
          stroke={goldColor}
          strokeWidth="0.8"
        />
        <text
          x="50"
          y="88"
          textAnchor="middle"
          fontSize="5.8"
          fontWeight="900"
          fill="#7A0000"
          fontFamily="serif"
        >
          वसुधैव कुटुम्बकम्
        </text>
      </svg>

      {/* Brand Wordmark & Local College Typography */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: '1.22rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              SYMBIOSIS
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: goldColor,
                background: 'rgba(153, 0, 0, 0.08)',
                padding: '2px 7px',
                borderRadius: '9999px',
                border: `1px solid rgba(212, 175, 55, 0.35)`,
              }}
            >
              SIU
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: primaryColor,
              }}
            >
              CapstoneTrack
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
              }}
            >
              {campus}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
