import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, LogIn, Sparkles, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const demoAccounts = [
    { role: 'Coordinator', label: 'Dr. Rajesh Verma (Head)', email: 'coordinator@college.edu', pass: 'Coord@123', icon: '👑', color: '#8F75FF' },
    { role: 'Guide', label: 'Dr. Arun Sharma (AI/ML)', email: 'arun.sharma@college.edu', pass: 'Guide@123', icon: '🧑‍🏫', color: '#6C47FF' },
    { role: 'Student (Allocated)', label: 'Aarav Joshi (Team 1 Lead)', email: 'aarav.1@college.edu', pass: 'Student@123', icon: '🎒', color: '#0E6545' },
    { role: 'Student (Unallocated)', label: 'Tanvi Shukla (Team 4 Lead)', email: 'tanvi.10@college.edu', pass: 'Student@123', icon: '⚡', color: '#D97706' },
    { role: 'Solo Student', label: 'Rohan Singh (Ungrouped)', email: 'rohan.37@college.edu', pass: 'Student@123', icon: '👤', color: '#2563EB' },
    { role: 'Panel Reviewer', label: 'Dr. Meera Oberoi (Panel)', email: 'panel.oberoi@college.edu', pass: 'Panel@123', icon: '⚖️', color: '#9333EA' },
  ];

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      // Redirect to portal based on role
      if (user.role === 'coordinator') navigate('/portal/coordinator');
      else if (user.role === 'guide') navigate('/portal/guide');
      else if (user.role === 'panel') navigate('/portal/panel');
      else navigate('/portal/student');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid login credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div style={{ maxWidth: 960, width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
        {/* Left Side: Form Card */}
        <div className="clay-card" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8F75FF 0%, #6C47FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(108, 71, 255, 0.35)',
              }}
            >
              🎓
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Welcome Back</h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sign in to your CapstoneTrack portal</p>
            </div>
          </div>

          {error && (
            <div
              className="clay-pill clay-pill-missing"
              style={{ width: '100%', padding: '10px 16px', marginBottom: 20, justifyContent: 'center' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
                College Email Address
              </label>
              <input
                type="email"
                className="clay-input"
                placeholder="e.g. coordinator@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                className="clay-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="clay-btn clay-btn-primary"
              style={{ marginTop: 8, width: '100%', padding: '14px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : (
                <>Sign In to Portal <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link to="/" style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
              ← Return to Landing Page
            </Link>
          </div>
        </div>

        {/* Right Side: Demo Quick-Fill Picker */}
        <div className="clay-card" style={{ padding: '36px', background: 'rgba(255, 255, 255, 0.85)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Sparkles size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>1-Click Demo Profiles</h2>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            Click any collegiate role to instantly populate credentials and test the live application flows:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {demoAccounts.map((acc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickFill(acc)}
                className="clay-card clay-card-sm"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                  border: 'none',
                  background: email === acc.email ? '#ECE7FE' : 'var(--bg-card)',
                  transition: 'all 0.18s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.3rem' }}>{acc.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {acc.role}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {acc.label}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Auto-fill
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
