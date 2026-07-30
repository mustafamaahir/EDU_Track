import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const ALL_CLASSES = ['Form 1A', 'Form 1B', 'Form 2A', 'Form 2B', 'Form 3A', 'Form 3B']

export default function AdminDashboard() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'superadmin'
  const TABS = isSuperAdmin
    ? ['Pending Approvals', 'Upload Results', 'Manage Admins']
    : ['Pending Approvals', 'Upload Results']
  const [tab, setTab] = useState('Pending Approvals')

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <h1 style={styles.title}>{isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}</h1>
          <span style={styles.roleBadge}>{user?.name}</span>
        </div>
        <div style={styles.tabs}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}>{t}</button>
          ))}
        </div>
        {tab === 'Pending Approvals' && <PendingTab />}
        {tab === 'Upload Results'    && <UploadTab />}
        {tab === 'Manage Admins'     && isSuperAdmin && <ManageAdminsTab />}
      </div>
    </div>
  )
}

function PendingTab() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  function load() { setLoading(true); api.get('/admin/pending').then(r => setPending(r.data.pending)).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])
  async function approve(id, name) { await api.patch(`/admin/approve/${id}`); setMsg(`✅ ${name} approved.`); load() }
  async function reject(id, name) {
    if (!window.confirm(`Reject ${name}?`)) return
    await api.delete(`/admin/reject/${id}`); setMsg(`Rejected ${name}.`); load()
  }
  if (loading) return <p style={styles.msg}>Loading...</p>
  return (
    <div>
      {msg && <div style={styles.success}>{msg}</div>}
      {pending.length === 0
        ? <div style={styles.empty}><div style={{fontSize:'2rem'}}>✅</div><p>No pending approvals.</p></div>
        : <div style={styles.listCard}>
            <div style={styles.listHeader}>{pending.length} student(s) waiting</div>
            {pending.map(s => (
              <div key={s.id} style={styles.listRow}>
                <div style={styles.studentInfo}>
                  <div style={styles.avatar}>{s.name.split(' ').map(w=>w[0]).join('')}</div>
                  <div>
                    <div style={styles.studentName}>{s.name}</div>
                    <div style={styles.studentMeta}>@{s.username} · {s.class_name}</div>
                  </div>
                </div>
                <div style={styles.actions}>
                  <button onClick={() => approve(s.id, s.name)} style={styles.btnApprove}>Approve</button>
                  <button onClick={() => reject(s.id, s.name)} style={styles.btnReject}>Reject</button>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

function UploadTab() {
  const { user } = useAuth()
  const [myClasses, setMyClasses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [week, setWeek] = useState('')
  const subjects = ['Math', 'English', 'Science', 'History', 'ICT']
  const [scores, setScores] = useState({})
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.role === 'superadmin') setMyClasses(ALL_CLASSES)
    else api.get('/admin/my-classes').then(r => setMyClasses(r.data.classes))
    api.get('/admin/students').then(r => setStudents(r.data.students))
  }, [])

  const classStudents = students.filter(s => s.class_name === selectedClass)
  function setScore(username, subject, value) {
    setScores(p => ({ ...p, [username]: { ...p[username], [subject]: value } }))
  }
  async function handleUpload() {
    if (!week || !selectedClass) { setError('Enter week and select class.'); return }
    setError(''); setMsg(''); setLoading(true)
    try {
      await api.post('/admin/upload-results', {
        week, class_name: selectedClass,
        results: classStudents.map(s => ({
          username: s.username,
          subjects: subjects.map(subj => ({ subject: subj, score: parseFloat(scores[s.username]?.[subj] || 0), max_score: 100 }))
        }))
      })
      setMsg(`✅ Results for ${week} (${selectedClass}) uploaded!`)
      setScores({})
    } catch (e) { setError(e.response?.data?.detail || 'Upload failed.') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div style={styles.controls}>
        <div style={styles.field}>
          <label style={styles.label}>Week</label>
          <input value={week} onChange={e => setWeek(e.target.value)} placeholder="e.g. Week 4" style={styles.input} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={styles.input}>
            <option value="">Select class</option>
            {myClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {selectedClass && classStudents.length === 0 && <div style={styles.empty}><p>No approved students in {selectedClass}.</p></div>}
      {selectedClass && classStudents.length > 0 && (
        <div style={styles.tableWrap}>
          <div style={styles.classTag}>📚 {selectedClass} — {classStudents.length} students</div>
          <table style={styles.table}>
            <thead><tr>
              <th style={styles.th}>Student</th>
              {subjects.map(s => <th key={s} style={styles.th}>{s}</th>)}
            </tr></thead>
            <tbody>
              {classStudents.map(student => (
                <tr key={student.username}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{student.name}</td>
                  {subjects.map(subj => (
                    <td key={subj} style={styles.td}>
                      <input type="number" min="0" max="100"
                        value={scores[student.username]?.[subj] || ''}
                        onChange={e => setScore(student.username, subj, e.target.value)}
                        style={styles.scoreInput} placeholder="0" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {msg && <div style={styles.success}>{msg}</div>}
      {error && <div style={styles.error}>{error}</div>}
      <button onClick={handleUpload} disabled={loading || !selectedClass || !week} style={styles.btnUpload}>
        {loading ? 'Uploading...' : 'Upload Results'}
      </button>
    </div>
  )
}

function ManageAdminsTab() {
  const [admins, setAdmins] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', name: '', classes: [] })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  function load() { api.get('/admin/admins').then(r => setAdmins(r.data.admins)) }
  useEffect(() => { load() }, [])

  function toggleClass(cls) {
    setForm(p => ({ ...p, classes: p.classes.includes(cls) ? p.classes.filter(c => c !== cls) : [...p.classes, cls] }))
  }

  async function createAdmin(e) {
    e.preventDefault(); setError('')
    try {
      await api.post('/admin/create-admin', form)
      setMsg(`✅ Admin '${form.name}' created.`)
      setForm({ username: '', password: '', name: '', classes: [] })
      setShowForm(false); load()
    } catch (err) { setError(err.response?.data?.detail || 'Failed.') }
  }

  async function deleteAdmin(id, name) {
    if (!window.confirm(`Delete admin ${name}?`)) return
    await api.delete(`/admin/delete-admin/${id}`)
    setMsg(`${name} deleted.`); load()
  }

  return (
    <div>
      {msg && <div style={styles.success}>{msg}</div>}
      {error && <div style={styles.error}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={() => setShowForm(!showForm)} style={styles.btnUpload}>{showForm ? 'Cancel' : '+ New Admin'}</button>
      </div>
      {showForm && (
        <form onSubmit={createAdmin} style={styles.formCard}>
          <h3 style={styles.formTitle}>Create New Admin</h3>
          <div style={styles.formRow}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} style={styles.input} placeholder="Mr. Acheampong" required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input value={form.username} onChange={e => setForm(p=>({...p,username:e.target.value}))} style={styles.input} placeholder="mr.acheampong" required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input type="password" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} style={styles.input} placeholder="Min. 6 chars" required />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Assign Classes</label>
            <div style={styles.classGrid}>
              {ALL_CLASSES.map(cls => (
                <label key={cls} style={{ ...styles.classChip, ...(form.classes.includes(cls) ? styles.classChipActive : {}) }}>
                  <input type="checkbox" checked={form.classes.includes(cls)} onChange={() => toggleClass(cls)} style={{ display: 'none' }} />
                  {cls}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" style={styles.btnUpload}>Create Admin</button>
        </form>
      )}
      {admins.length === 0
        ? <div style={styles.empty}><p>No admins created yet.</p></div>
        : <div style={styles.listCard}>
            <div style={styles.listHeader}>{admins.length} admin(s)</div>
            {admins.map(a => (
              <div key={a.id} style={styles.listRow}>
                <div style={styles.studentInfo}>
                  <div style={{ ...styles.avatar, background: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }}>
                    {a.name.split(' ').map(w=>w[0]).join('')}
                  </div>
                  <div>
                    <div style={styles.studentName}>{a.name}</div>
                    <div style={styles.studentMeta}>@{a.username} · {a.classes.length > 0 ? a.classes.join(', ') : 'No classes'}</div>
                  </div>
                </div>
                <button onClick={() => deleteAdmin(a.id, a.name)} style={styles.btnReject}>Delete</button>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

const styles = {
  page:{  minHeight:'100vh', 
          background:'#fdf4ff', 
          padding:'2.5rem 1.5rem' },
  container:{ maxWidth:960, 
              margin:'0 auto' },
  pageHeader:{  display:'flex', 
                alignItems:'center', 
                justifyContent:'space-between', 
                marginBottom:'1.5rem' },
  title:{   fontFamily:'"Georgia",serif', 
            fontSize:'1.75rem', 
            color:'#1f2937', 
            margin:0 },
  roleBadge:{   padding:'0.3rem 0.9rem', 
                background:'#f5f0ff', 
                color:'#7c3aed', 
                borderRadius:999, 
                fontSize:'0.85rem', 
                fontWeight:600 },
  tabs:{ display:'flex', gap:'0.5rem', marginBottom:'2rem', borderBottom:'2px solid #e9d5ff' },
  tab:{ padding:'0.6rem 1.25rem', border:'none', background:'transparent', fontFamily:'inherit', fontSize:'0.9rem', fontWeight:500, color:'#9ca3af', cursor:'pointer', borderBottom:'2px solid transparent', marginBottom:'-2px' },
  tabActive:{ color:'#7c3aed', fontWeight:700, borderBottomColor:'#7c3aed' },
  msg:{ textAlign:'center', color:'#6b7280', padding:'2rem' },
  success:{ background:'#dcfce7', color:'#15803d', borderRadius:8, padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.9rem' },
  error:{ background:'#fee2e2', color:'#dc2626', borderRadius:8, padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.9rem' },
  empty:{ textAlign:'center', padding:'3rem', background:'#fff', borderRadius:14, border:'1px dashed #e9d5ff', color:'#9ca3af' },
  listCard:{ background:'#fff', borderRadius:14, border:'1px solid #e9d5ff', overflow:'hidden' },
  listHeader:{ padding:'1rem 1.5rem', background:'#faf5ff', borderBottom:'1px solid #e9d5ff', fontSize:'0.85rem', fontWeight:600, color:'#7c3aed' },
  listRow:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.5rem', borderBottom:'1px solid #faf5ff', flexWrap:'wrap', gap:'0.75rem' },
  studentInfo:{ display:'flex', alignItems:'center', gap:'0.75rem' },
  avatar:{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#ec4899)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.8rem' },
  studentName:{ fontWeight:600, color:'#1f2937', fontSize:'0.95rem' },
  studentMeta:{ fontSize:'0.78rem', color:'#9ca3af', marginTop:'0.1rem' },
  actions:{ display:'flex', gap:'0.5rem' },
  btnApprove:{ padding:'0.4rem 1rem', borderRadius:8, border:'none', background:'#dcfce7', color:'#15803d', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' },
  btnReject:{ padding:'0.4rem 1rem', borderRadius:8, border:'none', background:'#fee2e2', color:'#dc2626', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' },
  controls:{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'1.5rem' },
  field:{ display:'flex', flexDirection:'column', gap:'0.35rem', minWidth:200 },
  label:{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#6b7280' },
  input:{ padding:'0.65rem 0.9rem', border:'1.5px solid #e9d5ff', borderRadius:8, fontFamily:'inherit', fontSize:'0.9rem', outline:'none' },
  classTag:{ padding:'0.75rem 1.5rem', background:'#faf5ff', borderBottom:'1px solid #e9d5ff', fontSize:'0.85rem', fontWeight:600, color:'#7c3aed' },
  tableWrap:{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:14, overflow:'auto', marginBottom:'1.5rem' },
  table:{ width:'100%', borderCollapse:'collapse' },
  th:{ padding:'0.65rem 1rem', background:'#faf5ff', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#7c3aed', textAlign:'left', borderBottom:'1px solid #e9d5ff' },
  td:{ padding:'0.75rem 1rem', borderBottom:'1px solid #faf5ff', fontSize:'0.9rem', color:'#374151' },
  scoreInput:{ width:64, padding:'0.4rem 0.5rem', border:'1.5px solid #e9d5ff', borderRadius:6, fontFamily:'monospace', fontSize:'0.9rem', textAlign:'center', outline:'none' },
  btnUpload:{ padding:'0.85rem 2.5rem', borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#db2777)', color:'#fff', border:'none', fontWeight:700, fontSize:'0.95rem', cursor:'pointer' },
  formCard:{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:14, padding:'1.5rem', marginBottom:'1.5rem' },
  formTitle:{ fontWeight:700, color:'#1f2937', marginBottom:'1rem' },
  formRow:{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'1rem' },
  classGrid:{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginTop:'0.25rem' },
  classChip:{ padding:'0.4rem 0.9rem', borderRadius:999, border:'1.5px solid #e9d5ff', fontSize:'0.82rem', fontWeight:500, color:'#6b7280', cursor:'pointer' },
  classChipActive:{ background:'#f5f0ff', borderColor:'#7c3aed', color:'#7c3aed', fontWeight:700 },
}
