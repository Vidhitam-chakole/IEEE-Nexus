import React, { useState, useEffect } from 'react';
import PortalLayout from '../components/layout/PortalLayout';
import { coordinatorApi, allocationApi, reviewsApi, teamsApi } from '../api/endpoints';
import {
  Users, AlertTriangle, CheckCircle, BarChart3,
  Calendar, RefreshCw, Sliders, ArrowUpRight, Award, Plus, Edit2
} from 'lucide-react';

export default function CoordinatorDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewSlots, setReviewSlots] = useState([]);
  const [priorityMode, setPriorityMode] = useState('cgpa');
  const [allocationSummary, setAllocationSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Manual override states
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideTeamId, setOverrideTeamId] = useState('');
  const [overrideGuideId, setOverrideGuideId] = useState('');
  const [guidesList, setGuidesList] = useState([]);

  // Capacity update modal
  const [editGuide, setEditGuide] = useState(null);
  const [newCapacity, setNewCapacity] = useState(3);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, heatRes, revRes, guidesRes] = await Promise.all([
        coordinatorApi.getDashboard(),
        coordinatorApi.getHeatmap(),
        reviewsApi.listReviews(),
        teamsApi.getGuidesList(),
      ]);
      setDashboardData(dashRes.data);
      setHeatmapData(heatRes.data);
      setReviews(revRes.data);
      setGuidesList(guidesRes.data);

      if (revRes.data.length > 0) {
        setSelectedReview(revRes.data[0]);
        loadSlots(revRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load coordinator data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (revId) => {
    try {
      const slotsRes = await reviewsApi.getSlots(revId);
      setReviewSlots(slotsRes.data);
    } catch (err) {
      console.error('Failed to load slots', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunAllocation = async () => {
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await allocationApi.runAllocation(priorityMode);
      setAllocationSummary(res.data.summary);
      setMessage({ type: 'success', text: `Allocation executed! ${res.data.summary.satisfaction_pct}% satisfaction achieved.` });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to run allocation.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoSchedule = async () => {
    if (!selectedReview) return;
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await reviewsApi.autoSchedule(selectedReview.id, {
        daily_start_time: '09:00',
        daily_end_time: '17:00',
        room_prefix: 'Lab 40',
      });
      setMessage({ type: 'success', text: res.data.message });
      await loadSlots(selectedReview.id);
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to auto-schedule review slots.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideTeamId || !overrideGuideId) return;
    try {
      setActionLoading(true);
      await allocationApi.override(overrideTeamId, overrideGuideId, 'Manual coordinator assignment');
      setShowOverrideModal(false);
      setMessage({ type: 'success', text: 'Team allocation manually overridden.' });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Override failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCapacity = async (e) => {
    e.preventDefault();
    if (!editGuide) return;
    try {
      setActionLoading(true);
      await coordinatorApi.updateCapacity(editGuide.id, newCapacity);
      setEditGuide(null);
      setMessage({ type: 'success', text: `Capacity updated for ${editGuide.guide_name}.` });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update capacity.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <PortalLayout>
        <div style={{ padding: 60, textAlign: 'center', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          Loading Coordinator Control Center...
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Coordinator Control Center</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 4 }}>
              Manage guide allocations, zero-conflict schedules, and track lagging teams in real time.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setShowOverrideModal(true)}
              className="clay-btn clay-btn-secondary"
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              <Sliders size={16} /> Manual Override
            </button>
            <button
              onClick={handleRunAllocation}
              className="clay-btn clay-btn-primary"
              style={{ padding: '10px 24px', fontSize: '0.9rem' }}
              disabled={actionLoading}
            >
              <RefreshCw size={16} className={actionLoading ? 'animate-spin' : ''} />
              {actionLoading ? 'Allocating...' : 'Run Allocation'}
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {message && (
          <div
            className={`clay-pill ${message.type === 'success' ? 'clay-pill-approved' : 'clay-pill-missing'}`}
            style={{ width: '100%', padding: '12px 20px', fontSize: '0.95rem', justifyContent: 'center' }}
          >
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            {message.text}
          </div>
        )}

        {/* 1. KPI SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {/* Total Teams */}
          <div className="clay-card clay-card-sm" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--clay-lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              👥
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>{dashboardData?.total_teams || 0}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Registered Teams</div>
            </div>
          </div>

          {/* Unallocated Teams */}
          <div className="clay-card clay-card-sm" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--clay-peach)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              ⚡
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: (dashboardData?.unallocated_teams > 0) ? '#D97706' : 'inherit' }}>
                {dashboardData?.unallocated_teams || 0}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Unallocated Teams</div>
            </div>
          </div>

          {/* Guides At Capacity */}
          <div className="clay-card clay-card-sm" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--clay-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              🧑‍🏫
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>{dashboardData?.guides_at_capacity || 0} / 10</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Guides at Full Capacity</div>
            </div>
          </div>

          {/* Upcoming Reviews */}
          <div className="clay-card clay-card-sm" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--clay-baby-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              📅
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900 }}>{dashboardData?.upcoming_reviews_count || 0}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Active Review Milestones</div>
            </div>
          </div>
        </div>

        {/* 2. ALLOCATION RESULTS BANNER (IF RUN) */}
        {allocationSummary && (
          <div className="clay-card" style={{ background: '#F8F6FF', border: '2px solid var(--accent-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Award size={24} color="var(--accent-primary)" />
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Allocation Execution Summary</h2>
              </div>
              <div className="clay-pill clay-pill-active" style={{ fontSize: '0.9rem' }}>
                Satisfaction: {allocationSummary.satisfaction_pct}%
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, textAlign: 'center' }}>
              <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-card-sm)', boxShadow: 'var(--shadow-clay-card)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{allocationSummary.allocated_1st}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Got 1st Choice</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-card-sm)', boxShadow: 'var(--shadow-clay-card)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0E6545' }}>{allocationSummary.allocated_2nd}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Got 2nd Choice</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-card-sm)', boxShadow: 'var(--shadow-clay-card)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#D97706' }}>{allocationSummary.allocated_3rd}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Got 3rd Choice</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-card-sm)', boxShadow: 'var(--shadow-clay-card)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#9F1239' }}>{allocationSummary.unallocated_count}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Unallocated Overflow</div>
              </div>
            </div>

            {/* If unallocated overflow exists */}
            {allocationSummary.unallocated_teams?.length > 0 && (
              <div style={{ marginTop: 20, padding: 16, background: '#FFF7ED', borderRadius: 'var(--radius-card-sm)' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#9A3412', marginBottom: 8 }}>
                  ⚠️ Unallocated Teams & Recommended Open Faculty:
                </div>
                {allocationSummary.unallocated_teams.map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #FED7AA' }}>
                    <span style={{ fontWeight: 700 }}>{t.team_name} (CGPA: {t.avg_cgpa})</span>
                    <span style={{ fontSize: '0.85rem', color: '#7C2D12' }}>
                      Suggested Guides: {t.suggested_guides?.map(g => `${g.guide_name} (${g.remaining_capacity} left)`).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. TEAMS FALLING BEHIND TABLE (RED HIGHLIGHT) */}
        <div className="clay-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <AlertTriangle size={22} color="#9F1239" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Teams Falling Behind Schedule</h2>
            <span className="clay-pill clay-pill-missing" style={{ marginLeft: 8 }}>
              {dashboardData?.falling_behind_teams?.length || 0} Teams Flagged (7+ days inactive)
            </span>
          </div>

          {dashboardData?.falling_behind_teams?.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#0E6545', fontWeight: 700, background: 'var(--clay-mint)', borderRadius: 'var(--radius-card-sm)' }}>
              🎉 Excellent! All active teams have submitted progress logs within the last 7 days.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(142, 134, 173, 0.2)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px 16px' }}>TEAM NAME</th>
                    <th style={{ padding: '12px 16px' }}>ASSIGNED GUIDE</th>
                    <th style={{ padding: '12px 16px' }}>LAST ACTIVITY</th>
                    <th style={{ padding: '12px 16px' }}>DAYS OVERDUE</th>
                    <th style={{ padding: '12px 16px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.falling_behind_teams?.map((team) => (
                    <tr
                      key={team.team_id}
                      style={{
                        borderBottom: '1px solid rgba(142, 134, 173, 0.15)',
                        backgroundColor: 'rgba(255, 220, 229, 0.4)',
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 800 }}>{team.team_name}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{team.guide_name}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{team.last_log_date}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#9F1239' }}>{team.days_overdue} days overdue</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="clay-pill clay-pill-missing">Urgent Attention</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. PROGRESS HEATMAP (TEAMS x WEEKS 1..12) */}
        <div className="clay-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Continuous Progress Heatmap</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>
                12-week status matrix across all teams. Green = Approved, Amber = Submitted, Red = Missing.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <span className="clay-pill clay-pill-approved">● Approved</span>
              <span className="clay-pill clay-pill-pending">● Submitted</span>
              <span className="clay-pill clay-pill-missing">● Missing</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(142, 134, 173, 0.2)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', minWidth: 200 }}>TEAM & GUIDE</th>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <th key={i} style={{ padding: '10px 8px', minWidth: 44, fontFamily: 'var(--font-mono)' }}>
                      W{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => (
                  <tr key={row.team_id} style={{ borderBottom: '1px solid rgba(142, 134, 173, 0.1)' }}>
                    <td style={{ textAlign: 'left', padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{row.team_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{row.guide_name}</div>
                    </td>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const wkNum = i + 1;
                      const stat = row.weeks[wkNum] || 'missing';
                      const bg =
                        stat === 'approved' ? '#D4F5E9' :
                        stat === 'submitted' ? '#FFE4D6' : '#FFDCE5';
                      const color =
                        stat === 'approved' ? '#0E6545' :
                        stat === 'submitted' ? '#92400E' : '#9F1239';

                      return (
                        <td key={wkNum} style={{ padding: '8px 4px' }}>
                          <div
                            title={`Week ${wkNum}: ${stat}`}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: bg,
                              color: color,
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              boxShadow: 'var(--shadow-clay-pill)',
                            }}
                          >
                            {stat === 'approved' ? '✓' : stat === 'submitted' ? '⏳' : '✕'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. GUIDE LOAD BARS & CAPACITY ADJUSTER */}
        <div className="clay-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Faculty Supervision Loads & Capacity</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>
                Balanced load tracking across all 10 faculty guides. Click Edit to adjust individual capacity.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {dashboardData?.guide_loads?.map((guide) => {
              const pct = Math.min(100, Math.round((guide.assigned_teams / guide.max_teams) * 100));
              return (
                <div
                  key={guide.guide_id}
                  className="clay-card clay-card-sm"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    background: guide.is_at_capacity ? '#FDF2F4' : 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>{guide.guide_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{guide.department}</div>
                    </div>
                    <button
                      onClick={() => {
                        setEditGuide(guide);
                        setNewCapacity(guide.max_teams);
                      }}
                      className="clay-btn clay-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>
                      <span>Load: {guide.assigned_teams} / {guide.max_teams} Teams</span>
                      <span>{pct}%</span>
                    </div>
                    <div style={{ width: '100%', height: 10, borderRadius: 9999, background: 'var(--bg-inset)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: guide.is_at_capacity ? '#FF6B6B' : 'var(--accent-primary)',
                          borderRadius: 9999,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. CONFLICT-FREE REVIEW SCHEDULING PANEL */}
        <div className="clay-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Review Milestones & Conflict-Free Scheduling</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>
                Autonomous slot allocation ensuring zero overlaps across faculty, panel evaluators, and venues.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {reviews.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedReview(r);
                    loadSlots(r.id);
                  }}
                  className={`clay-btn ${selectedReview?.id === r.id ? 'clay-btn-primary' : 'clay-btn-secondary'}`}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  {r.title}
                </button>
              ))}
              <button
                onClick={handleAutoSchedule}
                className="clay-btn clay-btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                disabled={actionLoading}
              >
                Auto-Schedule Slots
              </button>
            </div>
          </div>

          {reviewSlots.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No slots scheduled for this review milestone yet. Click "Auto-Schedule Slots" to arrange presentations with zero clashes.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {reviewSlots.map((slot) => (
                <div key={slot.id} className="clay-card clay-card-sm" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="clay-pill clay-pill-active" style={{ fontSize: '0.75rem' }}>
                      📍 {slot.room_or_link}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>{slot.team_name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Guide: {slot.guide_name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Panel: {slot.panel_name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: MANUAL OVERRIDE ALLOCATION */}
      {showOverrideModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(28, 21, 59, 0.45)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div className="clay-card" style={{ maxWidth: 480, width: '100%', padding: 32 }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Manual Allocation Override</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              Administratively assign any team to a specific guide, bypassing algorithm queues.
            </p>

            <form onSubmit={handleOverrideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                  Select Team
                </label>
                <select
                  className="clay-input"
                  value={overrideTeamId}
                  onChange={(e) => setOverrideTeamId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Team --</option>
                  {heatmapData.map((t) => (
                    <option key={t.team_id} value={t.team_id}>
                      {t.team_name} (Current: {t.guide_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                  Assign to Guide
                </label>
                <select
                  className="clay-input"
                  value={overrideGuideId}
                  onChange={(e) => setOverrideGuideId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Faculty Guide --</option>
                  {guidesList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.full_name} ({g.current_load}/{g.max_teams} Teams)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="clay-btn clay-btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary"
                  style={{ padding: '10px 24px' }}
                  disabled={actionLoading}
                >
                  Confirm Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE GUIDE CAPACITY */}
      {editGuide && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(28, 21, 59, 0.45)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div className="clay-card" style={{ maxWidth: 420, width: '100%', padding: 32 }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Update Supervision Capacity</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              Adjust max team limit for {editGuide.guide_name}.
            </p>

            <form onSubmit={handleUpdateCapacity} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                  Maximum Teams (1 - 10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="clay-input"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(parseInt(e.target.value))}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditGuide(null)}
                  className="clay-btn clay-btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clay-btn clay-btn-primary"
                  style={{ padding: '10px 24px' }}
                  disabled={actionLoading}
                >
                  Save Capacity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
