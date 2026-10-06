import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Home, Users, Calendar, FileText, Settings, Award } from 'lucide-react';

export default function PortalLayout({ children }) {
  const { user, logout, isStudent, isGuide, isCoordinator, isPanel } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (isCoordinator) return { label: 'Coordinator', pill: 'clay-pill-active', icon: '👑' };
    if (isGuide) return { label: 'Guide', pill: 'clay-pill-approved', icon: '🧑‍🏫' };
    if (isPanel) return { label: 'Panel', pill: 'clay-pill-pending', icon: '⚖️' };
    return { label: 'Student', pill: 'clay-pill-approved', icon: '🎒' };
  };

  const badge = getRoleBadge();

  // Role specific nav links (Max 5 items per role)
  const navLinks = isCoordinator ? [
    { label: 'Control Center', path: '/portal/coordinator', icon: <Home size={18} /> },
  ] : isGuide ? [
    { label: 'My Teams & Logs', path: '/portal/guide', icon: <Home size={18} /> },
  ] : isPanel ? [
    { label: 'Evaluation Slots', path: '/portal/panel', icon: <Calendar size={18} /> },
  ] : [
    { label: 'My Project Hub', path: '/portal/student', icon: <Home size={18} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Clay Navbar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          boxShadow: 'var(--shadow-clay-card)',
          padding: '12px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
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
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Capstone<span style={{ color: 'var(--accent-primary)' }}>Track</span>
            </span>
          </Link>

          {/* Navigation Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 20 }}>
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-pill)',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  transition: 'all 0.18s ease',
                  backgroundColor: location.pathname === item.path ? 'var(--bg-inset)' : 'transparent',
                  color: location.pathname === item.path ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* User Profile Pill & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            className={`clay-pill ${badge.pill}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            <span>{badge.icon}</span>
            <span>{user?.full_name || 'User'}</span>
            <span style={{ opacity: 0.7 }}>({badge.label})</span>
          </div>

          <button
            onClick={handleLogout}
            className="clay-btn clay-btn-secondary"
            style={{ padding: '8px 18px', fontSize: '0.82rem' }}
            title="Log Out"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1300, width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
