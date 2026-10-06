import React, { useState, useEffect } from 'react';
import PortalLayout from '../components/layout/PortalLayout';
import { useAuth } from '../context/AuthContext';
import { allocationApi, logsApi, documentsApi, reviewsApi, internshipsApi } from '../api/endpoints';
import {
  Users, CheckCircle2, Clock, AlertTriangle, FileText,
  Calendar, Check, X, MessageSquare, Download, Award
} from 'lucide-react';

export default function GuideDashboard() {
  const { user, guideProfile } = useAuth();
  const [allocatedTeams, setAllocatedTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamLogs, setTeamLogs] = useState([]);
  const [teamDocs, setTeamDocs] = useState([]);
  const [reviewSlots, setReviewSlots] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Review modal / action states
  const [activeLogReview, setActiveLogReview] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [reviewAction, setReviewAction] = useState('approved');

  const loadGuideData = async () => {
    try {
      setLoading(true);
      const allocRes = await allocationApi.getResults();

      // Filter allocations belonging to this guide
      const myAllocs = allocRes.data.allocations.filter(
        (a) => a.guide_name.toLowerCase().includes(user.full_name.toLowerCase()) ||
               (guideProfile && a.guide_id === guideProfile.id)
      );
      setAllocatedTeams(myAllocs);

      if (myAllocs.length > 0) {
        setSelectedTeam(myAllocs[0]);
        await loadTeamDetails(myAllocs[0].team_id);
      }

      // Load reviews
      const revRes = await reviewsApi.listReviews();
      if (revRes.data.length > 0) {
        const slotsRes = await reviewsApi.getSlots(revRes.data[0].id);
        const mySlots = slotsRes.data.filter(
          (s) => s.guide_name.toLowerCase().includes(user.full_name.toLowerCase())
        );
        setReviewSlots(mySlots);
      }

      // Load internships
      try {
        const internRes = await internshipsApi.getAllRequests();
        setInternships(internRes.data);
      } catch (e) {}

    } catch (err) {
      console.error('Failed to load guide data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamDetails = async (teamId) => {
    try {
      const [logsRes, docsRes] = await Promise.all([
        logsApi.getTeamLogs(teamId),
        documentsApi.getTeamDocuments(teamId),
      ]);
      setTeamLogs(logsRes.data);
      setTeamDocs(docsRes.data);
    } catch (err) {
      console.error('Failed to load team details', err);
    }
  };

  useEffect(() => {
    loadGuideData();
  }, [user]);

  const handleSelectTeam = async (t) => {
    setSelectedTeam(t);
    await loadTeamDetails(t.team_id);
  };

  const handleReviewLogSubmit = async (e) => {
    e.preventDefault();
    if (!activeLogReview) return;
    try {
      setActionLoading(true);
      setMessage(null);
      await logsApi.reviewLog(activeLogReview.id, reviewAction, feedbackComment);
      setMessage({ type: 'success', text: `Week ${activeLogReview.week_number} marked as ${reviewAction}.` });
      setActiveLogReview(null);
      setFeedbackComment('');
      if (selectedTeam) await loadTeamDetails(selectedTeam.team_id);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to review log.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInternshipDecision = async (reqId, status) => {
    try {
      setActionLoading(true);
      await internshipsApi.reviewByGuide(reqId, status, 'Guide recommendation provided.');
      setMessage({ type: 'success', text: `Internship request marked as ${status}.` });
      const internRes = await internshipsApi.getAllRequests();
      setInternships(internRes.data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update internship status.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && allocatedTeams.length === 0) {
    return (
      <PortalLayout>
        <div style={{ padding: 60, textAlign: 'center', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          Loading Guide Workspace...
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Header Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Faculty Supervision Workspace</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 4 }}>
              Welcome, {user?.full_name}. Oversee your allocated capstone teams, sign off weekly logs, and inspect deliverables.
            </p>
          </div>

          <div className="clay-pill clay-pill-active" style={{ fontSize: '0.95rem' }}>
            Allocated Teams: {allocatedTeams.length} / {guideProfile?.max_teams || 3} Max Capacity
          </div>
        </div>

        {message && (
          <div
            className={`clay-pill ${message.type === 'success' ? 'clay-pill-approved' : 'clay-pill-missing'}`}
            style={{ width: '100%', padding: '12px 20px', fontSize: '0.95rem', justifyContent: 'center' }}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {message.text}
          </div>
        )}

        {/* 1. ALLOCATED TEAMS SELECTOR */}
        <div className="clay-card">
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 16 }}>Your Supervised Capstone Teams</h2>

          {allocatedTeams.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No teams allocated yet. The department coordinator will run the guide allocation engine shortly.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
              {allocatedTeams.map((t) => (
                <button
                  key={t.team_id}
                  onClick={() => handleSelectTeam(t)}
                  className="clay-card clay-card-sm"
                  style={{
                    minWidth: 260,
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: 'none',
                    background: selectedTeam?.team_id === t.team_id ? '#ECE7FE' : 'var(--bg-card)',
                    boxShadow: selectedTeam?.team_id === t.team_id ? 'var(--shadow-clay-card-hover)' : 'var(--shadow-clay-card)',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 4 }}>
                    {t.is_manual_override ? 'Direct Coordinator Assignment' : `Assigned via Preference #${t.allocated_rank}`}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{t.team_name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Allocated on {new Date(t.allocated_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. SELECTED TEAM WORKSPACE */}
        {selectedTeam && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
            {/* Left: Weekly Progress Logs Review */}
            <div className="clay-card">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>
                Weekly Progress Logbook — {selectedTeam.team_name}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                Review weekly log submissions, provide advisory comments, and sign off or request modifications.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {teamLogs.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No logs submitted by this team yet.
                  </div>
                ) : (
                  teamLogs.map((log) => (
                    <div key={log.id} className="clay-card clay-card-sm" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Week {log.week_number}</span>
                        <span className={`clay-pill ${log.status === 'approved' ? 'clay-pill-approved' : log.status === 'submitted' ? 'clay-pill-pending' : 'clay-pill-missing'}`}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.9rem', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Completed: </span>
                        {log.work_done}
                      </div>

                      <div style={{ fontSize: '0.9rem', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Next: </span>
                        {log.planned_next}
                      </div>

                      {log.blockers && (
                        <div style={{ fontSize: '0.85rem', color: '#9F1239', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700 }}>Blockers: </span> {log.blockers}
                        </div>
                      )}

                      {log.guide_feedback && (
                        <div style={{ padding: '8px 12px', background: '#F4F1FD', borderRadius: 'var(--radius-input)', fontSize: '0.82rem', marginBottom: 12 }}>
                          <span style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>Your Feedback: </span>
                          {log.guide_feedback}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                        <button
                          onClick={() => {
                            setActiveLogReview(log);
                            setReviewAction('approved');
                            setFeedbackComment(log.guide_feedback || 'Work verified and approved.');
                          }}
                          className="clay-btn clay-btn-primary"
                          style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                        >
                          <Check size={14} /> Approve Log
                        </button>
                        <button
                          onClick={() => {
                            setActiveLogReview(log);
                            setReviewAction('needs_changes');
                            setFeedbackComment(log.guide_feedback || '');
                          }}
                          className="clay-btn clay-btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          <MessageSquare size={14} /> Request Changes
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Deliverables & Team Documents */}
            <div className="clay-card">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>
                Team Deliverables & Files — {selectedTeam.team_name}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                Inspect uploaded synopsis, SRS, progress presentation, and code files.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {teamDocs.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No deliverables uploaded by this team yet.
                  </div>
                ) : (
                  teamDocs.map((doc) => (
                    <div key={doc.id} className="clay-card clay-card-sm" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="clay-pill clay-pill-active" style={{ fontSize: '0.75rem' }}>{doc.doc_type.toUpperCase()}</span>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{doc.original_filename}</span>
                          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>v{doc.version}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                          Uploaded {new Date(doc.uploaded_at).toLocaleDateString()} ({(doc.file_size_bytes / 1024).toFixed(1)} KB)
                        </div>
                      </div>

                      <a
                        href={documentsApi.getDownloadUrl(doc.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="clay-btn clay-btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      >
                        <Download size={14} /> Download
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. YOUR UPCOMING REVIEW EVALUATION SLOTS */}
        <div className="clay-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Calendar size={22} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Upcoming Review Presentation Slots</h2>
          </div>

          {reviewSlots.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No review slots scheduled for your teams yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {reviewSlots.map((slot) => (
                <div key={slot.id} className="clay-card clay-card-sm" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span className="clay-pill clay-pill-active" style={{ fontSize: '0.75rem' }}>
                      📍 {slot.room_or_link}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{slot.team_name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Evaluator: {slot.panel_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. INTERNSHIP APPROVAL QUEUE (STRETCH 1) */}
        <div className="clay-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 8 }}>Student Internship Requests</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Approve or reject industrial internship requests submitted by students under your supervision.
          </p>

          {internships.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No pending internship approval requests.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {internships.map((req) => (
                <div key={req.id} className="clay-card clay-card-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{req.student_name} ({req.department})</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      {req.company_name} — {req.role_title} ({req.start_date} to {req.end_date})
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className={`clay-pill ${req.guide_status === 'approved' ? 'clay-pill-approved' : 'clay-pill-pending'}`}>
                      {req.guide_status.toUpperCase()}
                    </span>
                    {req.guide_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleInternshipDecision(req.id, 'approved')}
                          className="clay-btn clay-btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleInternshipDecision(req.id, 'rejected')}
                          className="clay-btn clay-btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: LOG REVIEW FEEDBACK */}
      {activeLogReview && (
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
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 8 }}>
              Review Week {activeLogReview.week_number} Log
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Action: <strong style={{ textTransform: 'uppercase' }}>{reviewAction}</strong>
            </p>

            <form onSubmit={handleReviewLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                  Faculty Review Remarks & Feedback
                </label>
                <textarea
                  className="clay-input"
                  rows={4}
                  placeholder="Provide constructive guidance, acknowledge achievements, or specify what needs revision..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setActiveLogReview(null)}
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
                  Submit Sign-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
