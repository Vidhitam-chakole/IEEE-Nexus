import React, { useState, useEffect } from 'react';
import PortalLayout from '../components/layout/PortalLayout';
import { useAuth } from '../context/AuthContext';
import {
  teamsApi, logsApi, documentsApi, submissionsApi, internshipsApi
} from '../api/endpoints';
import {
  Users, Lock, CheckCircle2, Clock, Upload, FileText,
  AlertCircle, Sparkles, Send, Download, ExternalLink, ShieldCheck
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, refreshProfile } = useAuth();
  const [team, setTeam] = useState(null);
  const [guides, setGuides] = useState([]);
  const [logs, setLogs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [finalSubmission, setFinalSubmission] = useState(null);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Ungrouped student form states
  const [createTeamName, setCreateTeamName] = useState('');
  const [createProjectTitle, setCreateProjectTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // Preference form state
  const [pref1, setPref1] = useState('');
  const [pref2, setPref2] = useState('');
  const [pref3, setPref3] = useState('');

  // Weekly log form state
  const [logWeek, setLogWeek] = useState(1);
  const [logWorkDone, setLogWorkDone] = useState('');
  const [logPlanned, setLogPlanned] = useState('');
  const [logBlockers, setLogBlockers] = useState('');

  // Document upload state
  const [uploadDocType, setUploadDocType] = useState('synopsis');
  const [selectedFile, setSelectedFile] = useState(null);

  // Final submission state
  const [finalSemester, setFinalSemester] = useState('Semester 8 - 2026');
  const [finalReportDocId, setFinalReportDocId] = useState('');
  const [finalGitUrl, setFinalGitUrl] = useState('');
  const [finalDemoUrl, setFinalDemoUrl] = useState('');

  // Internship form state
  const [internCompany, setInternCompany] = useState('');
  const [internRole, setInternRole] = useState('');
  const [internStart, setInternStart] = useState('');
  const [internEnd, setInternEnd] = useState('');
  const [internOfferDocId, setInternOfferDocId] = useState('');

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const [guidesRes] = await Promise.all([
        teamsApi.getGuidesList(),
      ]);
      setGuides(guidesRes.data);

      try {
        const teamRes = await teamsApi.getMyTeam();
        setTeam(teamRes.data);

        // Prepopulate preferences if already set
        if (teamRes.data.preferences?.length === 3) {
          const sorted = [...teamRes.data.preferences].sort((a, b) => a.rank - b.rank);
          setPref1(sorted[0].guide_id);
          setPref2(sorted[1].guide_id);
          setPref3(sorted[2].guide_id);
        }

        // Load logs, documents, submissions
        const [logsRes, docsRes] = await Promise.all([
          logsApi.getTeamLogs(teamRes.data.id),
          documentsApi.getTeamDocuments(teamRes.data.id),
        ]);
        setLogs(logsRes.data);
        setDocuments(docsRes.data);

        try {
          const subRes = await submissionsApi.getTeamSubmission(teamRes.data.id);
          setFinalSubmission(subRes.data);
          if (subRes.data) {
            setFinalReportDocId(subRes.data.report_doc_id);
            setFinalGitUrl(subRes.data.git_repo_url);
            setFinalDemoUrl(subRes.data.demo_url || '');
          }
        } catch (e) {
          // No submission yet
        }
      } catch (err) {
        // Not in team
        setTeam(null);
      }

      // Load internships
      try {
        const internRes = await internshipsApi.getMyRequests();
        setInternships(internRes.data);
      } catch (e) {}

    } catch (err) {
      console.error('Error loading student hub', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  // --- ACTIONS ---
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setMessage(null);
      await teamsApi.createTeam(createTeamName, createProjectTitle);
      setMessage({ type: 'success', text: 'Team created successfully! Share your join code with teammates.' });
      await refreshProfile();
      await loadStudentData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to create team.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setMessage(null);
      await teamsApi.joinTeam(joinCode.trim().toUpperCase());
      setMessage({ type: 'success', text: 'Joined team successfully!' });
      await refreshProfile();
      await loadStudentData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to join team.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLockTeam = async () => {
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await teamsApi.lockTeam();
      setMessage({ type: 'success', text: res.data.message });
      await loadStudentData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to lock team.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitPreferences = async (e) => {
    e.preventDefault();
    if (!pref1 || !pref2 || !pref3) {
      setMessage({ type: 'error', text: 'Please select all 3 preferences.' });
      return;
    }
    if (new Set([pref1, pref2, pref3]).size !== 3) {
      setMessage({ type: 'error', text: 'Preferences must be 3 different guides.' });
      return;
    }

    try {
      setActionLoading(true);
      setMessage(null);
      await teamsApi.submitPreferences([
        { guide_id: pref1, rank: 1 },
        { guide_id: pref2, rank: 2 },
        { guide_id: pref3, rank: 3 },
      ]);
      setMessage({ type: 'success', text: 'Guide preferences saved successfully!' });
      await loadStudentData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save preferences.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setMessage(null);
      await logsApi.submitLog({
        week_number: parseInt(logWeek),
        work_done: logWorkDone,
        planned_next: logPlanned,
        blockers: logBlockers,
      });
      setMessage({ type: 'success', text: `Week ${logWeek} progress log submitted!` });
      setLogWorkDone('');
      setLogPlanned('');
      setLogBlockers('');
      await loadStudentData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to submit log.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setActionLoading(true);
      setMessage(null);
      const formData = new FormData();
      formData.append('team_id', team.id);
      formData.append('doc_type', uploadDocType);
      formData.append('file', selectedFile);

      const res = await documentsApi.uploadDocument(formData);
      setMessage({ type: 'success', text: `Uploaded ${res.data.original_filename} (v${res.data.version})!` });
      setSelectedFile(null);
      await loadStudentData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Upload failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimilarityCheck = async (docId) => {
    try {
      const res = await documentsApi.checkSimilarity(docId);
      alert(`Similarity Score: ${res.data.similarity_score_pct}%\nResult: ${res.data.message}`);
    } catch (err) {
      alert('Similarity check failed.');
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!finalReportDocId) {
      setMessage({ type: 'error', text: 'Please select an uploaded final report document.' });
      return;
    }
    try {
      setActionLoading(true);
      setMessage(null);
      await submissionsApi.submitFinal({
        semester: finalSemester,
        report_doc_id: finalReportDocId,
        git_repo_url: finalGitUrl,
        demo_url: finalDemoUrl,
      });
      setMessage({ type: 'success', text: 'Final capstone submission recorded successfully!' });
      await loadStudentData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Submission failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInternshipSubmit = async (e) => {
    e.preventDefault();
    if (!internOfferDocId) {
      setMessage({ type: 'error', text: 'Please select an uploaded offer letter document.' });
      return;
    }
    try {
      setActionLoading(true);
      setMessage(null);
      await internshipsApi.submitRequest({
        company_name: internCompany,
        role_title: internRole,
        start_date: internStart,
        end_date: internEnd,
        offer_doc_id: internOfferDocId,
      });
      setMessage({ type: 'success', text: 'Internship approval request submitted!' });
      setInternCompany('');
      setInternRole('');
      await loadStudentData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to submit internship request.' });
    } finally {
      setActionLoading(false);
    }
  };

  const isLead = team && team.lead_id === user?.id;

  if (loading && !team) {
    return (
      <PortalLayout>
        <div style={{ padding: 60, textAlign: 'center', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          Loading Student Portal...
        </div>
      </PortalLayout>
    );
  }

  // --- CASE 1: UNGROUPED STUDENT ---
  if (!team) {
    return (
      <PortalLayout>
        <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Capstone Team Formation</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 4 }}>
              You are not currently in a capstone team. Form a new team as Team Lead or join using a 6-character code.
            </p>
          </div>

          {message && (
            <div
              className={`clay-pill ${message.type === 'success' ? 'clay-pill-approved' : 'clay-pill-missing'}`}
              style={{ padding: '12px 20px', justifyContent: 'center' }}
            >
              {message.text}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
            {/* Create Team Card */}
            <div className="clay-card">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Create New Team</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                You will be designated as the Team Lead and receive a unique 6-character code to invite 1 to 3 peers.
              </p>

              <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                    Team Name
                  </label>
                  <input
                    type="text"
                    className="clay-input"
                    placeholder="e.g. AeroNexus"
                    value={createTeamName}
                    onChange={(e) => setCreateTeamName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                    Proposed Project Title
                  </label>
                  <textarea
                    className="clay-input"
                    rows={3}
                    placeholder="e.g. Autonomous Search & Rescue Drone with Edge Vision"
                    value={createProjectTitle}
                    onChange={(e) => setCreateProjectTitle(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="clay-btn clay-btn-primary"
                  style={{ marginTop: 8 }}
                  disabled={actionLoading}
                >
                  Create Team & Become Lead
                </button>
              </form>
            </div>

            {/* Join Team Card */}
            <div className="clay-card">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Join Existing Team</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                Enter the 6-character team join code provided by your team lead.
              </p>

              <form onSubmit={handleJoinTeam} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                    6-Character Team Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    className="clay-input"
                    placeholder="e.g. NX104"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800, fontSize: '1.2rem' }}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="clay-btn clay-btn-secondary"
                  style={{ marginTop: 8 }}
                  disabled={actionLoading}
                >
                  Join Team
                </button>
              </form>
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  // --- CASE 2: ACTIVE TEAM DASHBOARD ---
  return (
    <PortalLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Global Feedback Banner */}
        {message && (
          <div
            className={`clay-pill ${message.type === 'success' ? 'clay-pill-approved' : 'clay-pill-missing'}`}
            style={{ width: '100%', padding: '12px 20px', fontSize: '0.95rem', justifyContent: 'center' }}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* 1. TEAM ROSTER & ALLOCATION STATUS CARD */}
        <div className="clay-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h1 style={{ fontSize: '1.9rem', fontWeight: 800 }}>{team.name}</h1>
                <span className="clay-pill clay-pill-active" style={{ fontFamily: 'var(--font-mono)' }}>
                  CODE: {team.code}
                </span>
                {team.is_locked ? (
                  <span className="clay-pill clay-pill-approved">🔒 Locked</span>
                ) : (
                  <span className="clay-pill clay-pill-pending">🔓 Unlocked (Open Roster)</span>
                )}
              </div>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                "{team.project_title}"
              </p>
            </div>

            {/* Team Lead Actions */}
            {isLead && !team.is_locked && (
              <button
                onClick={handleLockTeam}
                className="clay-btn clay-btn-primary"
                style={{ padding: '10px 22px' }}
                disabled={actionLoading}
              >
                <Lock size={16} /> Lock Team Roster
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Team Members List */}
            <div style={{ padding: '20px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-card-sm)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>Team Members ({team.members?.length || 0}/4)</span>
                <span style={{ color: 'var(--accent-primary)' }}>Avg CGPA: {team.avg_cgpa}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {team.members?.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ fontWeight: 700 }}>
                      {m.full_name} {m.student_id === team.lead_id && '👑 (Lead)'}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>CGPA: {m.cgpa || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Allocated Guide Card */}
            <div style={{ padding: '20px', background: 'var(--bg-inset)', borderRadius: 'var(--radius-card-sm)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 8 }}>Assigned Faculty Guide</div>
              {team.allocation ? (
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {team.allocation.guide_name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {team.allocation.is_manual_override ? 'Coordinator Direct Assignment' : `Assigned via Preference Choice #${team.allocation.allocated_rank}`}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#D97706', fontSize: '0.9rem', fontWeight: 700 }}>
                  ⚡ Awaiting Guide Allocation by Coordinator
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. GUIDE PREFERENCE RANKING (If locked) */}
        {team.is_locked && (
          <div className="clay-card">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 8 }}>Faculty Guide Preferences</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              Rank 3 distinct faculty preferences. The allocation engine prioritizes Choice 1, cascading to Choices 2 and 3 if capacities are full.
            </p>

            {isLead ? (
              <form onSubmit={handleSubmitPreferences} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: 6 }}>
                    1st Preference (Top Choice)
                  </label>
                  <select
                    className="clay-input"
                    value={pref1}
                    onChange={(e) => setPref1(e.target.value)}
                    required
                  >
                    <option value="">-- Select Guide --</option>
                    {guides.map((g) => (
                      <option key={g.id} value={g.id}>{g.full_name} ({g.specialisations?.slice(0, 2).join(', ')})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: 6 }}>
                    2nd Preference
                  </label>
                  <select
                    className="clay-input"
                    value={pref2}
                    onChange={(e) => setPref2(e.target.value)}
                    required
                  >
                    <option value="">-- Select Guide --</option>
                    {guides.map((g) => (
                      <option key={g.id} value={g.id}>{g.full_name} ({g.specialisations?.slice(0, 2).join(', ')})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: 6 }}>
                    3rd Preference
                  </label>
                  <select
                    className="clay-input"
                    value={pref3}
                    onChange={(e) => setPref3(e.target.value)}
                    required
                  >
                    <option value="">-- Select Guide --</option>
                    {guides.map((g) => (
                      <option key={g.id} value={g.id}>{g.full_name} ({g.specialisations?.slice(0, 2).join(', ')})</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                  <button
                    type="submit"
                    className="clay-btn clay-btn-primary"
                    disabled={actionLoading}
                  >
                    Save Guide Preferences
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {team.preferences?.map((p) => (
                  <div key={p.id} className="clay-card clay-card-sm" style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-primary)' }}>Rank #{p.rank}</div>
                    <div style={{ fontWeight: 800 }}>{p.guide_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. WEEKLY PROGRESS LOGS SECTION */}
        <div className="clay-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 8 }}>Weekly Progress Logbook</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
            Submit continuous weekly logs detailing tasks accomplished, upcoming objectives, and roadblocks.
          </p>

          {/* New Log Submission Form */}
          <form onSubmit={handleSubmitLog} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32, padding: 24, background: 'var(--bg-inset)', borderRadius: 'var(--radius-card-sm)' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 140 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                  Week Number
                </label>
                <select
                  className="clay-input"
                  value={logWeek}
                  onChange={(e) => setLogWeek(e.target.value)}
                >
                  {Array.from({ length: 16 }).map((_, i) => (
                    <option key={i+1} value={i+1}>Week {i+1}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                  Key Tasks Completed This Week
                </label>
                <input
                  type="text"
                  className="clay-input"
                  placeholder="e.g. Trained YOLOv8 model, benchmarked latency on simulated drone"
                  value={logWorkDone}
                  onChange={(e) => setLogWorkDone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                  Planned Next Week
                </label>
                <input
                  type="text"
                  className="clay-input"
                  placeholder="e.g. Integrate obstacle avoidance sensor drivers"
                  value={logPlanned}
                  onChange={(e) => setLogPlanned(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                  Blockers / Impediments (Optional)
                </label>
                <input
                  type="text"
                  className="clay-input"
                  placeholder="e.g. Awaiting delivery of ESC controller board"
                  value={logBlockers}
                  onChange={(e) => setLogBlockers(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="clay-btn clay-btn-primary"
                style={{ padding: '10px 24px' }}
                disabled={actionLoading}
              >
                <Send size={16} /> Submit Weekly Log
              </button>
            </div>
          </form>

          {/* Historical Logs List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Submitted Logbook History</h3>
            {logs.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
                No weekly logs submitted yet.
              </div>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="clay-card clay-card-sm" style={{ padding: '18px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Week {l.week_number}</span>
                      <span className={`clay-pill ${l.status === 'approved' ? 'clay-pill-approved' : l.status === 'submitted' ? 'clay-pill-pending' : 'clay-pill-missing'}`}>
                        {l.status === 'approved' ? '✓ Approved' : l.status === 'submitted' ? '⏳ Submitted (Pending)' : '⚠️ Needs Changes'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Submitted {new Date(l.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Work Completed: </span>
                      {l.work_done}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Next Objectives: </span>
                      {l.planned_next}
                    </div>
                  </div>

                  {l.guide_feedback && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#F4F1FD', borderRadius: 'var(--radius-input)', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>Guide Feedback: </span>
                      {l.guide_feedback}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. DOCUMENT UPLOAD & VERSION HISTORY */}
        <div className="clay-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 8 }}>Deliverables & Document Management</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            Upload synopsis, SRS, progress presentations, and code bundles (PDF/DOCX/PPTX/ZIP up to 20MB). Automatic versioning supported.
          </p>

          <form onSubmit={handleUploadDocument} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <select
              className="clay-input"
              style={{ width: 180 }}
              value={uploadDocType}
              onChange={(e) => setUploadDocType(e.target.value)}
            >
              <option value="synopsis">Synopsis Report</option>
              <option value="srs">SRS Specification</option>
              <option value="report">Mid-Term Report</option>
              <option value="presentation">Presentation Deck</option>
              <option value="code_zip">Code Archive (.zip)</option>
            </select>

            <input
              type="file"
              className="clay-input"
              style={{ flex: 1, minWidth: 240 }}
              accept=".pdf,.docx,.pptx,.zip"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              required
            />

            <button
              type="submit"
              className="clay-btn clay-btn-primary"
              disabled={actionLoading || !selectedFile}
            >
              <Upload size={16} /> Upload Document
            </button>
          </form>

          {/* Documents Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(142, 134, 173, 0.2)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 14px' }}>TYPE</th>
                  <th style={{ padding: '10px 14px' }}>FILENAME</th>
                  <th style={{ padding: '10px 14px' }}>VERSION</th>
                  <th style={{ padding: '10px 14px' }}>SIZE</th>
                  <th style={{ padding: '10px 14px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(142, 134, 173, 0.15)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="clay-pill clay-pill-active" style={{ fontSize: '0.78rem' }}>{d.doc_type.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>{d.original_filename}</td>
                    <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>v{d.version}</td>
                    <td style={{ padding: '12px 14px' }}>{(d.file_size_bytes / 1024).toFixed(1)} KB</td>
                    <td style={{ padding: '12px 14px', display: 'flex', gap: 10 }}>
                      <a
                        href={documentsApi.getDownloadUrl(d.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="clay-btn clay-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        <Download size={14} /> Download
                      </a>
                      <button
                        type="button"
                        onClick={() => handleSimilarityCheck(d.id)}
                        className="clay-btn clay-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        <ShieldCheck size={14} /> Check Similarity
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. FINAL SEMESTER SUBMISSION RECORD */}
        <div className="clay-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Semester Capstone Submission</h2>
            {finalSubmission && (
              <span className={`clay-pill ${finalSubmission.status === 'accepted' ? 'clay-pill-approved' : 'clay-pill-pending'}`}>
                Status: {finalSubmission.status.toUpperCase()}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            Formal semester-end project dossier submission including Git repository, live demo link, and defended report.
          </p>

          <form onSubmit={handleFinalSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                Final Report Document
              </label>
              <select
                className="clay-input"
                value={finalReportDocId}
                onChange={(e) => setFinalReportDocId(e.target.value)}
                required
              >
                <option value="">-- Choose Uploaded Report --</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.original_filename} (v{d.version})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                Git Repository URL
              </label>
              <input
                type="url"
                className="clay-input"
                placeholder="https://github.com/organization/project"
                value={finalGitUrl}
                onChange={(e) => setFinalGitUrl(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                Live Demo / Video Link
              </label>
              <input
                type="url"
                className="clay-input"
                placeholder="https://demo.project.app or Loom"
                value={finalDemoUrl}
                onChange={(e) => setFinalDemoUrl(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
              <button
                type="submit"
                className="clay-btn clay-btn-primary"
                disabled={actionLoading || !isLead}
              >
                {finalSubmission ? 'Update Final Submission' : 'Submit Final Capstone Dossier'}
              </button>
              {!isLead && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 12 }}>
                  * Only the team lead can submit the final capstone record.
                </span>
              )}
            </div>
          </form>
        </div>

        {/* 6. INTERNSHIP APPROVAL WORKFLOW (STRETCH 1) */}
        <div className="clay-card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 8 }}>Internship Approval Portal</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            Seeking concurrent industry internship NOC? Submit your offer letter for dual guide & coordinator approval.
          </p>

          <form onSubmit={handleInternshipSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                Company Name
              </label>
              <input
                type="text"
                className="clay-input"
                placeholder="e.g. Google India / Cisco"
                value={internCompany}
                onChange={(e) => setInternCompany(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                Job Role / Title
              </label>
              <input
                type="text"
                className="clay-input"
                placeholder="e.g. Software Engineering Intern"
                value={internRole}
                onChange={(e) => setInternRole(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                Start Date
              </label>
              <input
                type="date"
                className="clay-input"
                value={internStart}
                onChange={(e) => setInternStart(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                End Date
              </label>
              <input
                type="date"
                className="clay-input"
                value={internEnd}
                onChange={(e) => setInternEnd(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6 }}>
                Offer Letter Document
              </label>
              <select
                className="clay-input"
                value={internOfferDocId}
                onChange={(e) => setInternOfferDocId(e.target.value)}
                required
              >
                <option value="">-- Select Uploaded Document --</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.original_filename}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="submit"
                className="clay-btn clay-btn-primary"
                style={{ width: '100%' }}
                disabled={actionLoading}
              >
                Submit for Approval
              </button>
            </div>
          </form>

          {/* Internship History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {internships.map((req) => (
              <div key={req.id} className="clay-card clay-card-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{req.company_name} — {req.role_title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Dates: {req.start_date} to {req.end_date} | Document: {req.offer_filename}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className={`clay-pill ${req.guide_status === 'approved' ? 'clay-pill-approved' : 'clay-pill-pending'}`}>
                    Guide: {req.guide_status.toUpperCase()}
                  </span>
                  <span className={`clay-pill ${req.coordinator_status === 'approved' ? 'clay-pill-approved' : 'clay-pill-pending'}`}>
                    Coordinator: {req.coordinator_status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
