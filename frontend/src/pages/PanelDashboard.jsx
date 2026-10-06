import React, { useState, useEffect } from 'react';
import PortalLayout from '../components/layout/PortalLayout';
import { useAuth } from '../context/AuthContext';
import { reviewsApi } from '../api/endpoints';
import { Calendar, Clock, MapPin, Users, Award, FileText } from 'lucide-react';

export default function PanelDashboard() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [assignedSlots, setAssignedSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPanelData = async () => {
    try {
      setLoading(true);
      const revRes = await reviewsApi.listReviews();
      setReviews(revRes.data);
      if (revRes.data.length > 0) {
        setSelectedReview(revRes.data[0]);
        await loadSlots(revRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load panel reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (revId) => {
    try {
      const slotsRes = await reviewsApi.getSlots(revId);
      // Filter slots assigned to this panel evaluator
      const mySlots = slotsRes.data.filter(
        (s) => s.panel_name.toLowerCase().includes(user.full_name.toLowerCase()) ||
               s.panel_user_id === user.id
      );
      setAssignedSlots(mySlots);
    } catch (err) {
      console.error('Failed to load slots', err);
    }
  };

  useEffect(() => {
    loadPanelData();
  }, [user]);

  const handleSelectReview = async (rev) => {
    setSelectedReview(rev);
    await loadSlots(rev.id);
  };

  return (
    <PortalLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Evaluation Panel Schedule</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 4 }}>
              Welcome, {user?.full_name}. Review your assigned project presentation slots and evaluation rooms.
            </p>
          </div>

          <div className="clay-pill clay-pill-pending" style={{ fontSize: '0.95rem' }}>
            Role: Review Panelist (Read-Only)
          </div>
        </div>

        {/* Milestone Selector */}
        <div className="clay-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Select Milestone:</span>
            {reviews.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelectReview(r)}
                className={`clay-btn ${selectedReview?.id === r.id ? 'clay-btn-primary' : 'clay-btn-secondary'}`}
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                {r.title}
              </button>
            ))}
          </div>
        </div>

        {/* Scheduled Slots Listing */}
        <div className="clay-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 8 }}>
            Assigned Presentation Slots — {selectedReview?.title}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
            Evaluation slots coordinated with zero timetable or venue clashes.
          </p>

          {assignedSlots.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No presentation slots assigned to your evaluation panel for this milestone.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {assignedSlots.map((slot) => (
                <div key={slot.id} className="clay-card clay-card-sm" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="clay-pill clay-pill-active" style={{ fontSize: '0.8rem' }}>
                      <MapPin size={12} /> {slot.room_or_link}
                    </span>
                    <span style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 6 }}>{slot.team_name}</h3>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Faculty Guide: <strong>{slot.guide_name}</strong>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Evaluation Date: {new Date(slot.start_time).toLocaleDateString()}
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(142, 134, 173, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="clay-pill clay-pill-approved" style={{ fontSize: '0.75rem' }}>
                      Slot Confirmed
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Defense Duration: 30 Mins
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
