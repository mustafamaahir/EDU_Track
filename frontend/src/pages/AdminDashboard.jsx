import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import WeekSettingsTab from './WeekSettingsTab'

const ALL_CLASSES = ['Dhahab','Fidda','Ihsaan','Thaqaafah','Thawaab','Taqwah', 'Rawda', 'Dhikr', 'Adult 1', 'Adult 2']

export default function AdminDashboard() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'superadmin'
console.log('user role:', user?.role, 'isSuperAdmin:', isSuperAdmin)
  const TABS = isSuperAdmin
    ? ['Pending Approvals','Upload Results','Manage Admins','Assign Students','Week Settings']
    : ['Pending Approvals','Upload Results']
  const [tab, setTab] = useState('Pending Approvals')

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.pageHeader}>
          <h1 style={s.title}>{isSuperAdmin ? '⭐ Super Admin' : '🛠 Admin Dashboard'}</h1>
          <span style={s.badge}>{user?.name}</span>
        </div>
        <div style={s.tabs}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{...s.tab,...(tab===t?s.tabActive:{})}}>
              {t}
            </button>
          ))}
        </div>
        {tab==='Pending Approvals' && <PendingTab />}
        {tab==='Upload Results'    && <UploadTab />}
        {tab==='Manage Admins'     && isSuperAdmin && <ManageAdminsTab />}
        {tab==='Assign Students'   && isSuperAdmin && <AssignStudentsTab />}
        {tab==='Week Settings'     && isSuperAdmin && <WeekSettingsTab />}
      </div>
    </div>
  )
}

// ── Pending Approvals ─────────────────────────────────────────────
function PendingTab() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  function load() { setLoading(true); api.get('/admin/pending').then(r=>setPending(r.data.pending)).finally(()=>setLoading(false)) }
  useEffect(()=>{load()},[])

  async function approve(id,name){ await api.patch(`/admin/approve/${id}`); setMsg(`✅ ${name} approved.`); load() }
  async function reject(id,name){
    if(!window.confirm(`Reject ${name}?`)) return
    await api.delete(`/admin/reject/${id}`); setMsg(`${name} rejected.`); load()
  }

  if(loading) return <p style={s.msg}>Loading...</p>
  return (
    <div>
      {msg && <div style={s.success}>{msg}</div>}
      {pending.length===0
        ? <div style={s.empty}><div style={{fontSize:'2rem'}}>✅</div><p>No pending approvals.</p></div>
        : <div style={s.card}>
            <div style={s.cardHeader}>{pending.length} student(s) waiting for approval</div>
            {pending.map(st=>(
              <div key={st.id} style={s.row}>
                <div style={s.info}>
                  <div style={s.av}>{st.name.split(' ').map(w=>w[0]).join('')}</div>
                  <div>
                    <div style={s.nm}>{st.name}</div>
                    <div style={s.meta}>@{st.username} · {st.class_name}</div>
                  </div>
                </div>
                <div style={s.acts}>
                  <button onClick={()=>approve(st.id,st.name)} style={s.btnGreen}>Approve</button>
                  <button onClick={()=>reject(st.id,st.name)} style={s.btnRed}>Reject</button>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// ── Upload Results ────────────────────────────────────────────────
function UploadTab() {
  const { user } = useAuth()
  const [myClasses, setMyClasses]   = useState([])
  const [students, setStudents]     = useState([])
  const [subjects, setSubjects]     = useState([])
  const [selClass, setSelClass]     = useState('')
  const [week, setWeek]             = useState('')
  const [scores, setScores]         = useState({})
  const [msg, setMsg]               = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [loadingScores, setLoadingScores] = useState(false)

  // Load classes on mount
  useEffect(()=>{
    if(user?.role==='superadmin') setMyClasses(ALL_CLASSES)
    else api.get('/admin/my-classes').then(r=>setMyClasses(r.data.classes))
    api.get('/admin/students').then(r=>setStudents(r.data.students))
  },[])

  // Load subjects when class changes
  useEffect(()=>{
    if(!selClass) return
    setSubjects([])
    api.get(`/admin/my-subjects?class_name=${encodeURIComponent(selClass)}`)
      .then(r=>setSubjects(r.data.subjects))
  },[selClass])

  // Load existing scores when both week and class are selected
  useEffect(()=>{
    if(!week||!selClass) return
    setLoadingScores(true)
    api.get(`/admin/existing-results?week=${encodeURIComponent(week)}&class_name=${encodeURIComponent(selClass)}`)
      .then(r=>setScores(r.data.scores))
      .finally(()=>setLoadingScores(false))
  },[week,selClass])

  const classStudents = students.filter(st=>st.class_name===selClass)

  function setScore(username,subject,value){
    setScores(p=>({...p,[username]:{...p[username],[subject]:value}}))
  }

  async function handleUpload(){
    if(!week||!selClass){setError('Enter week and select class.'); return}
    if(subjects.length===0){setError('No subjects assigned to you for this class.'); return}
    setError(''); setMsg(''); setLoading(true)
    try{
      await api.post('/admin/upload-results',{
        week, class_name:selClass,
        results:classStudents.map(st=>({
          username:st.username,
          subjects:subjects.map(sub=>({
            subject:sub,
            score:parseFloat(scores[st.username]?.[sub]||0),
            max_score:100
          }))
        }))
      })
      setMsg(`✅ Results for ${week} (${selClass}) saved successfully!`)
    }catch(e){setError(e.response?.data?.detail||'Upload failed.')}
    finally{setLoading(false)}
  }

  return (
    <div>
      <div style={s.controls}>
        <div style={s.field}>
          <label style={s.label}>Week</label>
          <input value={week} onChange={e=>setWeek(e.target.value.toLowerCase())} placeholder="e.g. Week 4" style={s.input}/>
        </div>
        <div style={s.field}>
          <label style={s.label}>Class</label>
          <select value={selClass} onChange={e=>setSelClass(e.target.value)} style={s.input}>
            <option value="">Select class</option>
            {myClasses.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {selClass && subjects.length===0 && (
        <div style={s.empty}><p>No subjects assigned to you for {selClass}. Contact the super admin.</p></div>
      )}

      {selClass && classStudents.length===0 && subjects.length>0 && (
        <div style={s.empty}><p>No approved students in {selClass}.</p></div>
      )}

      {selClass && classStudents.length>0 && subjects.length>0 && (
        <div style={s.tableWrap}>
          <div style={s.classTag}>
            📚 {selClass} · {subjects.join(', ')} · {classStudents.length} students
            {loadingScores && <span style={{marginLeft:'1rem',color:'#9ca3af',fontSize:'0.78rem'}}>Loading saved scores...</span>}
          </div>
          <table style={s.table}>
            <thead><tr>
              <th style={s.th}>Student</th>
              {subjects.map(sub=><th key={sub} style={s.th}>{sub}</th>)}
            </tr></thead>
            <tbody>
              {classStudents.map(st=>(
                <tr key={st.username}>
                  <td style={{...s.td,fontWeight:600}}>{st.name}</td>
                  {subjects.map(sub=>(
                    <td key={sub} style={s.td}>
                      <input type="number" min="0" max="100"
                        value={scores[st.username]?.[sub]??''}
                        onChange={e=>setScore(st.username,sub,e.target.value)}
                        style={{
                          ...s.scoreInput,
                          background: scores[st.username]?.[sub] ? '#f5f0ff' : '#fff'
                        }}
                        placeholder="0"/>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {msg && <div style={s.success}>{msg}</div>}
      {error && <div style={s.error}>{error}</div>}

      {selClass && classStudents.length>0 && (
        <button onClick={handleUpload} disabled={loading} style={s.btnPurple}>
          {loading?'Saving...':'Save Results'}
        </button>
      )}
    </div>
  )
}

// ── Manage Admins (superadmin) ────────────────────────────────────
function ManageAdminsTab() {
  const [admins, setAdmins]         = useState([])
  const [masterSubjects, setMaster] = useState([])
  const [showForm, setShow]         = useState(false)
  const [form, setForm]             = useState({username:'',password:'',name:'',classes:[]})
  const [msg, setMsg]               = useState('')
  const [error, setError]           = useState('')
  // Subject assignment state: { adminId_className: [subjects] }
  const [subjectEdits, setSubjectEdits] = useState({})
  const [expandedAdmin, setExpanded]    = useState(null)

  function load(){
    api.get('/admin/admins').then(r=>setAdmins(r.data.admins))
    api.get('/admin/master-subjects').then(r=>setMaster(r.data.subjects))
  }
  useEffect(()=>{load()},[])

  function toggleClass(cls){
    setForm(p=>({...p,classes:p.classes.includes(cls)?p.classes.filter(c=>c!==cls):[...p.classes,cls]}))
  }

  function toggleSubject(adminId, className, subject){
    const key = `${adminId}_${className}`
    setSubjectEdits(p=>{
      const current = p[key] ?? []
      return {...p,[key]:current.includes(subject)?current.filter(s=>s!==subject):[...current,subject]}
    })
  }

  function getSubjects(adminId, className, existingSubjects){
    const key = `${adminId}_${className}`
    return subjectEdits[key] ?? existingSubjects ?? []
  }

  async function saveSubjects(adminId, className, existingSubjects){
    const key      = `${adminId}_${className}`
    const subjects = subjectEdits[key] ?? existingSubjects ?? []
    await api.post('/admin/assign-subjects',{admin_id:adminId, class_name:className, subjects})
    setMsg(`✅ Subjects updated for ${className}.`)
    load()
  }

  async function createAdmin(e){
    e.preventDefault(); setError('')
    try{
      await api.post('/admin/create-admin',form)
      setMsg(`✅ Admin '${form.name}' created.`)
      setForm({username:'',password:'',name:'',classes:[]}); setShow(false); load()
    }catch(err){setError(err.response?.data?.detail||'Failed.')}
  }

  async function deleteAdmin(id,name){
    if(!window.confirm(`Delete admin ${name}?`)) return
    await api.delete(`/admin/delete-admin/${id}`)
    setMsg(`${name} deleted.`); load()
  }

  return (
    <div>
      {msg && <div style={s.success}>{msg}</div>}
      {error && <div style={s.error}>{error}</div>}

      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'1rem'}}>
        <button onClick={()=>setShow(!showForm)} style={s.btnPurple}>{showForm?'Cancel':'+ New Admin'}</button>
      </div>

      {showForm && (
        <form onSubmit={createAdmin} style={s.formCard}>
          <h3 style={s.formTitle}>Create New Admin</h3>
          <div style={s.formRow}>
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={s.input} placeholder="Mr. Acheampong" required/>
            </div>
            <div style={s.field}>
              <label style={s.label}>Username</label>
              <input value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} style={s.input} placeholder="mr.acheampong" required/>
            </div>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} style={s.input} placeholder="Min. 6 chars" required/>
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Assign Classes</label>
            <div style={s.chipGrid}>
              {ALL_CLASSES.map(cls=>(
                <label key={cls} style={{...s.chip,...(form.classes.includes(cls)?s.chipActive:{})}}>
                  <input type="checkbox" checked={form.classes.includes(cls)} onChange={()=>toggleClass(cls)} style={{display:'none'}}/>
                  {cls}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" style={s.btnPurple}>Create Admin</button>
        </form>
      )}

      {admins.length===0
        ? <div style={s.empty}><p>No admins created yet.</p></div>
        : <div>
            {admins.map(a=>(
              <div key={a.id} style={{...s.card,marginBottom:'1rem'}}>
                {/* Admin header row */}
                <div style={s.row}>
                  <div style={s.info}>
                    <div style={{...s.av,background:'linear-gradient(135deg,#0ea5e9,#6366f1)'}}>
                      {a.name.split(' ').map(w=>w[0]).join('')}
                    </div>
                    <div>
                      <div style={s.nm}>{a.name}</div>
                      <div style={s.meta}>@{a.username} · {a.classes.length>0?a.classes.join(', '):'No classes'}</div>
                    </div>
                  </div>
                  <div style={s.acts}>
                    <button onClick={()=>setExpanded(expandedAdmin===a.id?null:a.id)} style={s.btnBlue}>
                      {expandedAdmin===a.id?'Hide':'Assign Subjects'}
                    </button>
                    <button onClick={()=>deleteAdmin(a.id,a.name)} style={s.btnRed}>Delete</button>
                  </div>
                </div>

                {/* Subject assignment per class */}
                {expandedAdmin===a.id && a.classes.map(cls=>(
                  <div key={cls} style={s.subjectSection}>
                    <div style={s.subjectHeader}>📚 {cls}</div>
                    <div style={{padding:'1rem 1.5rem'}}>
                      <div style={s.chipGrid}>
                        {masterSubjects.map(sub=>{
                          const active = getSubjects(a.id,cls,a.subjects_by_class?.[cls]||[]).includes(sub)
                          return (
                            <label key={sub} style={{...s.chip,...(active?s.chipActive:{})}}>
                              <input type="checkbox" checked={active}
                                onChange={()=>toggleSubject(a.id,cls,sub)}
                                style={{display:'none'}}/>
                              {sub}
                            </label>
                          )
                        })}
                      </div>
                      <button
                        onClick={()=>saveSubjects(a.id,cls,a.subjects_by_class?.[cls]||[])}
                        style={{...s.btnGreen,marginTop:'0.75rem'}}>
                        Save Subjects for {cls}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// ── Assign Students (superadmin) ──────────────────────────────────
function AssignStudentsTab() {
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [msg, setMsg]           = useState('')
  const [editing, setEditing]   = useState({})

  function load(){
    setLoading(true)
    api.get('/admin/all-students').then(r=>setStudents(r.data.students)).finally(()=>setLoading(false))
  }
  useEffect(()=>{load()},[])

  async function assign(id,name){
    const cls = editing[id]
    if(!cls) return
    await api.patch(`/admin/assign-student/${id}?class_name=${encodeURIComponent(cls)}`)
    setMsg(`✅ ${name} assigned to ${cls}.`)
    load()
  }

  if(loading) return <p style={s.msg}>Loading...</p>

  const byClass = {}
  students.forEach(st=>{
    const cls = st.class_name||'Unassigned'
    if(!byClass[cls]) byClass[cls]=[]
    byClass[cls].push(st)
  })

  return (
    <div>
      {msg && <div style={s.success}>{msg}</div>}
      {Object.entries(byClass).sort().map(([cls,sts])=>(
        <div key={cls} style={{marginBottom:'1.5rem'}}>
          <div style={s.classTag}>📚 {cls} — {sts.length} student(s)</div>
          <div style={s.card}>
            {sts.map(st=>(
              <div key={st.id} style={s.row}>
                <div style={s.info}>
                  <div style={s.av}>{st.name.split(' ').map(w=>w[0]).join('')}</div>
                  <div>
                    <div style={s.nm}>{st.name}</div>
                    <div style={s.meta}>@{st.username} · {st.status}</div>
                  </div>
                </div>
                <div style={s.acts}>
                  <select
                    value={editing[st.id]||st.class_name||''}
                    onChange={e=>setEditing(p=>({...p,[st.id]:e.target.value}))}
                    style={{...s.input,minWidth:130,padding:'0.4rem 0.6rem'}}>
                    <option value="">Move to...</option>
                    {ALL_CLASSES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={()=>assign(st.id,st.name)} style={s.btnGreen}>Save</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const s = {
  page:{ minHeight:'100vh', background:'#fdf4ff', padding:'2.5rem 1.5rem' },
  container:{ maxWidth:980, margin:'0 auto' },
  pageHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' },
  title:{ fontFamily:'"Georgia",serif', fontSize:'1.75rem', color:'#1f2937', margin:0 },
  badge:{ padding:'0.3rem 0.9rem', background:'#f5f0ff', color:'#7c3aed', borderRadius:999, fontSize:'0.85rem', fontWeight:600 },
  tabs:{ display:'flex', gap:'0.5rem', marginBottom:'2rem', borderBottom:'2px solid #e9d5ff' },
  tab:{ padding:'0.6rem 1.25rem', border:'none', background:'transparent', fontFamily:'inherit', fontSize:'0.9rem', fontWeight:500, color:'#9ca3af', cursor:'pointer', borderBottom:'2px solid transparent', marginBottom:'-2px' },
  tabActive:{ color:'#7c3aed', fontWeight:700, borderBottomColor:'#7c3aed' },
  msg:{ textAlign:'center', color:'#6b7280', padding:'2rem' },
  success:{ background:'#dcfce7', color:'#15803d', borderRadius:8, padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.9rem' },
  error:{ background:'#fee2e2', color:'#dc2626', borderRadius:8, padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.9rem' },
  empty:{ textAlign:'center', padding:'3rem', background:'#fff', borderRadius:14, border:'1px dashed #e9d5ff', color:'#9ca3af' },
  card:{ background:'#fff', borderRadius:14, border:'1px solid #e9d5ff', overflow:'hidden' },
  cardHeader:{ padding:'1rem 1.5rem', background:'#faf5ff', borderBottom:'1px solid #e9d5ff', fontSize:'0.85rem', fontWeight:600, color:'#7c3aed' },
  row:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.5rem', borderBottom:'1px solid #faf5ff', flexWrap:'wrap', gap:'0.75rem' },
  info:{ display:'flex', alignItems:'center', gap:'0.75rem' },
  av:{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#ec4899)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.8rem', flexShrink:0 },
  nm:{ fontWeight:600, color:'#1f2937', fontSize:'0.95rem' },
  meta:{ fontSize:'0.78rem', color:'#9ca3af', marginTop:'0.1rem' },
  acts:{ display:'flex', gap:'0.5rem', alignItems:'center' },
  btnGreen:{ padding:'0.4rem 1rem', borderRadius:8, border:'none', background:'#dcfce7', color:'#15803d', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' },
  btnRed:{ padding:'0.4rem 1rem', borderRadius:8, border:'none', background:'#fee2e2', color:'#dc2626', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' },
  btnBlue:{ padding:'0.4rem 1rem', borderRadius:8, border:'none', background:'#dbeafe', color:'#1d4ed8', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' },
  btnPurple:{ padding:'0.85rem 2.5rem', borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#db2777)', color:'#fff', border:'none', fontWeight:700, fontSize:'0.95rem', cursor:'pointer' },
  controls:{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'1.5rem' },
  field:{ display:'flex', flexDirection:'column', gap:'0.35rem', minWidth:200 },
  label:{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#6b7280' },
  input:{ padding:'0.65rem 0.9rem', border:'1.5px solid #e9d5ff', borderRadius:8, fontFamily:'inherit', fontSize:'0.9rem', outline:'none' },
  classTag:{ padding:'0.75rem 1.5rem', background:'#faf5ff', borderBottom:'1px solid #e9d5ff', fontSize:'0.85rem', fontWeight:600, color:'#7c3aed', borderTopLeftRadius:14, borderTopRightRadius:14 },
  tableWrap:{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:14, overflow:'auto', marginBottom:'1.5rem' },
  table:{ width:'100%', borderCollapse:'collapse' },
  th:{ padding:'0.65rem 1rem', background:'#faf5ff', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#7c3aed', textAlign:'left', borderBottom:'1px solid #e9d5ff' },
  td:{ padding:'0.75rem 1rem', borderBottom:'1px solid #faf5ff', fontSize:'0.9rem', color:'#374151' },
  scoreInput:{ width:64, padding:'0.4rem 0.5rem', border:'1.5px solid #e9d5ff', borderRadius:6, fontFamily:'monospace', fontSize:'0.9rem', textAlign:'center', outline:'none' },
  formCard:{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:14, padding:'1.5rem', marginBottom:'1.5rem' },
  formTitle:{ fontWeight:700, color:'#1f2937', marginBottom:'1rem' },
  formRow:{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'1rem' },
  chipGrid:{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginTop:'0.25rem' },
  chip:{ padding:'0.4rem 0.9rem', borderRadius:999, border:'1.5px solid #e9d5ff', fontSize:'0.82rem', fontWeight:500, color:'#6b7280', cursor:'pointer' },
  chipActive:{ background:'#f5f0ff', borderColor:'#7c3aed', color:'#7c3aed', fontWeight:700 },
  subjectSection:{ borderTop:'1px solid #f3e8ff' },
  subjectHeader:{ padding:'0.65rem 1.5rem', background:'#fdfaff', fontSize:'0.82rem', fontWeight:600, color:'#7c3aed' },
}