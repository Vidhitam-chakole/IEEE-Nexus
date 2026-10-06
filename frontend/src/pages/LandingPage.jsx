import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import HeroCanvas from '../three/HeroCanvas';
import { ArrowDown, ArrowRight, CheckCircle2, Users, Calendar, Award, Shield } from 'lucide-react';

export default function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = Math.min(1, Math.max(0, window.scrollY / totalScroll));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper for word-by-word scroll reveal
  const renderWordByWord = (text, startP, endP) => {
    const words = text.split(' ');
    const span = (endP - startP) / words.length;

    return words.map((word, idx) => {
      const wordThreshold = startP + idx * span;
      const isLit = scrollProgress >= wordThreshold;
      return (
        <span
          key={idx}
          style={{
            display: 'inline-block',
            marginRight: '0.3em',
            transition: 'color 0.25s ease, opacity 0.25s ease',
            color: isLit ? 'var(--text-primary)' : 'rgba(142, 134, 173, 0.4)',
            opacity: isLit ? 1 : 0.45,
            fontWeight: isLit ? 800 : 700,
          }}
        >
          {word}
        </span>
      );
    });
  };

  // Section 4 HUD Labels
  const hudLabels = ['TEAM', 'GUIDE', 'REVIEWS', 'LOGS', 'SUBMIT'];
  const activeHudIdx = Math.min(
    hudLabels.length - 1,
    Math.max(0, Math.floor(((scrollProgress - 0.49) / (0.65 - 0.49)) * hudLabels.length))
  );

  // Section 5 Stats Column
  const activeStatCol =
    scrollProgress < 0.70 ? 0 : scrollProgress < 0.75 ? 1 : 2;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: '700vh' }}>
      {/* 1. PERSISTENT 3D HERO OBJECT CANVAS */}
      <HeroCanvas scrollProgress={scrollProgress} />

      {/* FIXED TOP NAVIGATION BAR */}
      <header
        style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)',
          maxWidth: 1180,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 28px',
          borderRadius: 'var(--radius-pill)',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          boxShadow: 'var(--shadow-clay-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8F75FF 0%, #6C47FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.2rem',
              boxShadow: '0 4px 10px rgba(108, 71, 255, 0.35)',
            }}
          >
            🎓
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Capstone<span style={{ color: 'var(--accent-primary)' }}>Track</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>

          </div>
          <Link to="/login" className="clay-btn clay-btn-primary" style={{ padding: '8px 22px', fontSize: '0.88rem' }}>
            Open Portal <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* =========================================================================
          SECTION 1: HERO (0vh - 100vh)
          ========================================================================= */}
      <section
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '120px 48px 48px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Giant Outlined Background Title */}
        <div
          style={{
            position: 'absolute',
            top: '46%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(3.5rem, 11vw, 10rem)',
            fontWeight: 900,
            color: 'transparent',
            WebkitTextStroke: '2px rgba(142, 134, 173, 0.28)',
            letterSpacing: '0.04em',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            zIndex: -1,
          }}
        >
          CapstoneTrack
        </div>

        <div />

        {/* Bottom Hero Two-Tone Tagline and Scroll Label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            maxWidth: 1200,
            width: '100%',
            margin: '0 auto',
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <h1 style={{ fontSize: 'clamp(2rem, 3.8vw, 3.4rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 12 }}>
              Final-year projects, <br />
              <span style={{ color: 'var(--accent-primary)' }}>finally organised.</span>
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Teams, guides, reviews, and logbooks in one unified platform.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 22px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(255, 255, 255, 0.75)',
              boxShadow: 'var(--shadow-clay-card)',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: 700,
            }}
          >


          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: PROBLEM (100vh - 200vh)
          ========================================================================= */}
      <section
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 64px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          className="clay-card"
          style={{
            maxWidth: 580,
            background: 'rgba(255, 250, 250, 0.92)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="clay-pill clay-pill-missing"
            style={{ marginBottom: 18 }}
          >
            The current problem
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', lineHeight: 1.25, marginBottom: 20 }}>
            {renderWordByWord('Scattered guides, missed reviews, last-minute logbooks.', 0.16, 0.32)}
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            WhatsApp groups lose critical synopsis files, coordinators spend days balancing spreadsheets,
            and review panels face schedule clashes. Capstone projects deserve better than chaos.
          </p>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: SOLUTION (200vh - 300vh)
          ========================================================================= */}
      <section
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '0 64px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          className="clay-card"
          style={{
            maxWidth: 580,
            background: 'rgba(245, 255, 251, 0.92)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="clay-pill clay-pill-approved"
            style={{ marginBottom: 18 }}
          >
            The solution we made
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', lineHeight: 1.25, marginBottom: 20 }}>
            {renderWordByWord('One place for every team, guide and review.', 0.33, 0.48)}
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Automated guide allocation based on team preference rankings and faculty capacity. Real-time
            conflict-free scheduling, digital weekly logbooks, and continuous progress visibility.
          </p>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: HOW IT WORKS (300vh - 400vh)
          ========================================================================= */}
      <section
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="clay-pill clay-pill-active" style={{ marginBottom: 12 }}>

          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Seamless 5-Step Progression</h2>
        </div>

        {/* HUD Arc with Bracketed Mono Labels */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 16,
            maxWidth: 820,
            padding: '24px 32px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(255, 255, 255, 0.85)',
            boxShadow: 'var(--shadow-clay-card)',
          }}
        >
          {hudLabels.map((lbl, idx) => {
            const isActive = idx === activeHudIdx && scrollProgress >= 0.49 && scrollProgress <= 0.65;
            return (
              <div
                key={lbl}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-pill)',
                  transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  background: isActive ? 'var(--accent-primary)' : 'var(--bg-inset)',
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  boxShadow: isActive ? 'var(--shadow-clay-button)' : 'none',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                [ {lbl} ]
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 24, fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {activeHudIdx === 0 && 'Step 1: Students form teams and lock roster with unique codes.'}
          {activeHudIdx === 1 && 'Step 2: Ranked 3-choice guide preferences matched with load balancing.'}
          {activeHudIdx === 2 && 'Step 3: Multi-phase review milestones scheduled with zero overlap.'}
          {activeHudIdx === 3 && 'Step 4: Continuous weekly progress sign-offs and feedback comments.'}
          {activeHudIdx === 4 && 'Step 5: Final capstone repository, demo link, and report defense.'}
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: STATS STRIP (400vh - 500vh)
          ========================================================================= */}
      <section
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: '90px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Dot Matrix Indicator Circle */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-clay-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: activeStatCol === 0 ? '1fr' : activeStatCol === 1 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: 4,
            }}
          >
            {Array.from({ length: activeStatCol === 0 ? 1 : activeStatCol === 1 ? 4 : 9 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                }}
              />
            ))}
          </div>
        </div>

        {/* 3-Column Stats Strip with Hairline Dividers */}
        <div
          className="clay-card"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            maxWidth: 1000,
            width: '90%',
            padding: '36px 48px',
            gap: 32,
            background: 'rgba(255, 255, 255, 0.92)',
          }}
        >
          {/* Stat 1 */}
          <div
            style={{
              textAlign: 'center',
              opacity: activeStatCol === 0 ? 1 : 0.35,
              transition: 'opacity 0.25s ease',
            }}
          >
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-primary)', lineHeight: 1 }}>
              1 Click
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 8, letterSpacing: '0.05em' }}>
              STABLE ALLOCATION
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              Greedy CGPA matching with load distribution guarantees.
            </p>
          </div>

          {/* Hairline Divider */}
          <div
            style={{
              textAlign: 'center',
              borderLeft: '1px solid rgba(142, 134, 173, 0.25)',
              borderRight: '1px solid rgba(142, 134, 173, 0.25)',
              padding: '0 24px',
              opacity: activeStatCol === 1 ? 1 : 0.35,
              transition: 'opacity 0.25s ease',
            }}
          >
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0E6545', lineHeight: 1 }}>
              0 Clashes
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 8, letterSpacing: '0.05em' }}>
              REVIEW SLOTS
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              Hard constraints prevent double-booking faculty and rooms.
            </p>
          </div>

          {/* Stat 3 */}
          <div
            style={{
              textAlign: 'center',
              opacity: activeStatCol === 2 ? 1 : 0.35,
              transition: 'opacity 0.25s ease',
            }}
          >
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#8F75FF', lineHeight: 1 }}>
              100%
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 8, letterSpacing: '0.05em' }}>
              PROGRESS VISIBILITY
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              12-week colored heatmaps spotlight falling-behind teams.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: ROLES (500vh - 600vh)
          ========================================================================= */}
      <section
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="clay-pill clay-pill-active" style={{ marginBottom: 12 }}>
            TAILORED WORKSPACES
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Built for Every Collegiate Stakeholder</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            maxWidth: 1100,
            width: '100%',
          }}
        >
          {/* Student */}
          <div className="clay-card clay-card-sm" style={{ background: 'rgba(255, 255, 255, 0.92)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}></div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 6 }}>Student</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Create teams via 6-char codes, rank 3 guide preferences, submit weekly logs, and upload reports.
            </p>
          </div>

          {/* Guide */}
          <div className="clay-card clay-card-sm" style={{ background: 'rgba(255, 255, 255, 0.92)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}></div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 6 }}>Guide</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Supervise multiple teams up to capacity, sign off on weekly logs, and approve internship letters.
            </p>
          </div>

          {/* Coordinator */}
          <div className="clay-card clay-card-sm" style={{ background: 'rgba(255, 255, 255, 0.92)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}></div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 6 }}>Coordinator</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Run preference allocation, adjust quotas, schedule review slots, and monitor the 12-week heatmap.
            </p>
          </div>

          {/* Panel */}
          <div className="clay-card clay-card-sm" style={{ background: 'rgba(255, 255, 255, 0.92)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}></div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 6 }}>Review Panel</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              View scheduled evaluation slots and inspect team synopsis and SRS documents without clashes.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: FINAL CTA (600vh - 700vh)
          ========================================================================= */}
      <section
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
        }}
      >
        <div
          className="clay-card"
          style={{
            maxWidth: 680,
            padding: '48px',
            background: 'rgba(255, 255, 255, 0.94)',
          }}
        >


          <h2 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: 16 }}>
            Experience CapstoneTrack Today
          </h2>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
            Preloaded with realistic collegiate seed data
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/login" className="clay-btn clay-btn-primary" style={{ padding: '16px 38px', fontSize: '1.1rem' }}>
              Launch Portal Now <ArrowRight size={20} />
            </Link>
          </div>


        </div>
      </section>
    </div>
  );
}
