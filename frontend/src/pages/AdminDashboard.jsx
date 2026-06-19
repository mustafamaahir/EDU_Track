import { useState, useEffect } from 'react'
import api from '../api/client'

const TABS = ['Pending Approvals', 'Upload Results']

export default function AdminDashboard() {
  const [tab, setTab] = useState('Pending Approvals')

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Admin Dashboard</h1>

        {/* Tab switcher */}
        <div style={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Pending Approvals' && <PendingTab />}
        {tab === 'Upload Results'    && <UploadTab />}
      </div>
    </div>
  )
}

// ── Pending Approvals Tab ─────────────────────────────────────────
function PendingTab() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')

  function load() {
    setLoading(true)
    api.get('/admin/pending')
      .then(res => setPending(res.data.pending))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function approve(id, name) {
    await api.patch(`/admin/approve/${id}`)
    setMsg(`✅ ${name} approved.`)
    load()
  }

  async function reject(id, name) {
    if (!window.confirm(`Reject and delete ${name}'s account?`)) return
    await api.delete(`/admin/reject/${id}`)
    setMsg(`🗑️ ${name}'s account rejected.`)
    load()
  }

  if (loading) return <p style={styles.msg}>Loading…</p>

  return (
    <div>
      {msg && <div style={styles.success}>{msg}</div>}

      {pending.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '2rem' }}>✅</div>
          <p>No pending approvals.</p>
        </div>
      ) : (
        <div style={styles.listCard}>
          <div style={styles.listHeader}>
            <span>{pending.length} student{pending.length !== 1 ? 's' : ''} waiting for approval</span>
          </div>
          {pending.map(s => (
            <div key={s.id} style={styles.listRow}>
              <div style={styles.studentInfo}>
                <div style={styles.avatar}>{s.name.split(' ').map(w => w[0]).join('')}</div>
                <div>
                  <div style={styles.studentName}>{s.name}</div>
                  <div style={styles.studentMeta}>@{s.username} · {s.class_name}</div>
                </div>
              </div>
              <div style={styles.actions}>
                <button onClick={() => approve(s.id, s.name)} style={styles.btnApprove}>Approve</button>
                <button onClick={() => reject(s.id, s.name)}  style={styles.btnReject}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Upload Results Tab ────────────────────────────────────────────
function UploadTab() {
  const [students, setStudents] = useState([])
  const [week, setWeek]         = useState('')
  const [className, setClass]   = useState('')
  const [subjects]              = useState(['Math', 'English', 'Science', 'History', 'ICT'])
  const [scores, setScores]     = useState({})
  const [msg, setMsg]           = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    api.get('/admin/students').then(res => setStudents(res.data.students))
  }, [])

  const classes          = [...new Set(students.map(s => s.class_name))]
  const approvedStudents = students.filter(s => s.class_name === className && s.status === 'approved')

  function setScore(username, subject, value) {
    setScores(prev => ({ ...prev, [username]: { ...prev[username], [subject]: value } }))
  }

  async function handleUpload() {
    if (!week || !className) { setError('Please enter a week and select a class.'); return }
    setError(''); setMsg(''); setLoading(true)

    const results = approvedStudents.map(s => ({
      username: s.username,
      subjects: subjects.map(subj => ({
        subject: subj, score: parseFloat(scores[s.username]?.[subj] || 0), max_score: 100,
      }))
    }))

    try {
      await api.post('/admin/upload-results', { week, class_name: className, results })
      setMsg(`✅ Results for ${week} (${className}) uploaded successfully!`)
      setScores({})
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={styles.controls}>
        <div style={styles.field}>
          <label style={styles.label}>Week</label>
          <input
            type="text" value={week}
            onChange={e => setWeek(e.target.value)}
            placeholder="e.g. Week 4" style={styles.input}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Class</label>
          <select value={className} onChange={e => setClass(e.target.value)} style={styles.input}>
            <option value="">Select class</option>
            {classes.filter(c => c !== 'Admin').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {className && approvedStudents.length === 0 && (
        <div style={styles.empty}><p>No approved students in {className} yet.</p></div>
      )}

      {className && approvedStudents.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Student</th>
                {subjects.map(s => <th key={s} style={styles.th}>{s}</th>)}
              </tr>
            </thead>
            <tbody>
              {approvedStudents.map(student => (
                <tr key={student.username}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{student.name}</td>
                  {subjects.map(subj => (
                    <td key={subj} style={styles.td}>
                      <input
                        type="number" min="0" max="100"
                        value={scores[student.username]?.[subj] || ''}
                        onChange={e => setScore(student.username, subj, e.target.value)}
                        style={styles.scoreInput} placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {msg   && <div style={styles.success}>{msg}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <button
        onClick={handleUpload}
        disabled={loading || !className || !week}
        style={styles.btnUpload}
      >
        {loading ? 'Uploading…' : 'Upload Results'}
      </button>
    </div>
  )
}

const styles = {
  page:      { minHeight: '100vh', background: '#fdf4ff', padding: '2.5rem 1.5rem' },
  container: { maxWidth: 960, margin: '0 auto' },
  title:     { fontFamily: '"Georgia", serif', fontSize: '1.75rem', color: '#1f2937', marginBottom: '1.5rem' },
  tabs: {
    display: 'flex', gap: '0.5rem',
    marginBottom: '2rem', borderBottom: '2px solid #e9d5ff', paddingBottom: '0',
  },
  tab: {
    padding: '0.6rem 1.25rem', border: 'none', background: 'transparent',
    fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 500,
    color: '#9ca3af', cursor: 'pointer', borderBottom: '2px solid transparent',
    marginBottom: '-2px',
  },
  tabActive:  { color: '#7c3aed', fontWeight: 700, borderBottomColor: '#7c3aed' },
  msg:        { textAlign: 'center', color: '#6b7280', padding: '2rem' },
  success:    { background: '#dcfce7', color: '#15803d', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem' },
  error:      { background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem' },
  empty: {
    textAlign: 'center', padding: '3rem', background: '#fff',
    borderRadius: 14, border: '1px dashed #e9d5ff', color: '#9ca3af',
  },
  listCard:   { background: '#fff', borderRadius: 14, border: '1px solid #e9d5ff', overflow: 'hidden' },
  listHeader: {
    padding: '1rem 1.5rem', background: '#faf5ff',
    borderBottom: '1px solid #e9d5ff', fontSize: '0.85rem',
    fontWeight: 600, color: '#7c3aed',
  },
  listRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 1.5rem', borderBottom: '1px solid #faf5ff',
    flexWrap: 'wrap', gap: '0.75rem',
  },
  studentInfo:  { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem',
  },
  studentName: { fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' },
  studentMeta: { fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.1rem' },
  actions:     { display: 'flex', gap: '0.5rem' },
  btnApprove: {
    padding: '0.4rem 1rem', borderRadius: 8, border: 'none',
    background: '#dcfce7', color: '#15803d',
    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
  },
  btnReject: {
    padding: '0.4rem 1rem', borderRadius: 8, border: 'none',
    background: '#fee2e2', color: '#dc2626',
    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
  },
  controls:   { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  field:      { display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 200 },
  label:      { fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' },
  input: {
    padding: '0.65rem 0.9rem', border: '1.5px solid #e9d5ff',
    borderRadius: 8, fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none',
  },
  tableWrap:  { background: '#fff', border: '1px solid #e9d5ff', borderRadius: 14, overflow: 'auto', marginBottom: '1.5rem' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '0.65rem 1rem', background: '#faf5ff',
    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.05em', color: '#7c3aed', textAlign: 'left',
    borderBottom: '1px solid #e9d5ff',
  },
  td:         { padding: '0.75rem 1rem', borderBottom: '1px solid #faf5ff', fontSize: '0.9rem', color: '#374151' },
  scoreInput: {
    width: 64, padding: '0.4rem 0.5rem', border: '1.5px solid #e9d5ff',
    borderRadius: 6, fontFamily: 'monospace', fontSize: '0.9rem',
    textAlign: 'center', outline: 'none',
  },
  btnUpload: {
    padding: '0.85rem 2.5rem', borderRadius: 10,
    background: 'linear-gradient(135deg, #7c3aed, #db2777)',
    color: '#fff', border: 'none', fontWeight: 700,
    fontSize: '0.95rem', cursor: 'pointer',
  },
}
