import { useState, useEffect } from 'react'
import api from '../api/client'

const MASTER_SUBJECTS = ["Arobiyyah", "Qiroohah", "Memorization", "Writing", "General Knowledge", "Tajweed"]

export default function WeekSettingsTab() {
  const [settings, setSettings] = useState([])
  const [form, setForm]         = useState({ week:'', tiebreaker:'', results_locked: true })
  const [msg, setMsg]           = useState('')
  const [error, setError]       = useState('')

  function load() {
    api.get('/admin/week-settings').then(r => setSettings(r.data.settings))
  }
  useEffect(() => { load() }, [])

  function editRow(s) {
    setForm({ week: s.week, tiebreaker: s.tiebreaker, results_locked: s.results_locked })
  }

  async function handleSave(e) {
    e.preventDefault()
    setError(''); setMsg('')
    try {
      await api.post('/admin/week-settings', form)
      setMsg(`✅ Settings for ${form.week} saved.`)
      setForm({ week:'', tiebreaker:'', results_locked: true })
      load()
    } catch(err) {
      setError(err.response?.data?.detail || 'Failed to save.')
    }
  }

  return (
    <div>
      {msg   && <div style={s.success}>{msg}</div>}
      {error && <div style={s.error}>{error}</div>}

      {/* Form */}
      <form onSubmit={handleSave} style={s.formCard}>
        <h3 style={s.formTitle}>Add / Update Week Settings</h3>
        <div style={s.formRow}>
          <div style={s.field}>
            <label style={s.label}>Week</label>
            <input value={form.week}
              onChange={e => setForm(p=>({...p,week:e.target.value}))}
              style={s.input} placeholder="e.g. Week 1" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Tiebreaker Subject</label>
            <select value={form.tiebreaker}
              onChange={e => setForm(p=>({...p,tiebreaker:e.target.value}))}
              style={s.input}>
              <option value="">None</option>
              {MASTER_SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
          <div style={s.field}>
            <label style={s.label}>Results Status</label>
            <select value={form.results_locked}
              onChange={e => setForm(p=>({...p,results_locked:e.target.value==='true'}))}
              style={s.input}>
              <option value="true">🔒 Locked</option>
              <option value="false">🔓 Unlocked</option>
            </select>
          </div>
        </div>
        <button type="submit" style={s.btnPurple}>Save Settings</button>
      </form>

      {/* Existing settings */}
      {settings.length === 0
        ? <div style={s.empty}><p>No week settings yet. Add one above.</p></div>
        : <div style={s.card}>
            <div style={s.cardHeader}>Week Settings</div>
            {settings.map(ws => (
              <div key={ws.week} style={s.row}>
                <div style={s.info}>
                  <div>
                    <div style={s.nm}>{ws.week}</div>
                    <div style={s.meta}>
                      Tiebreaker: {ws.tiebreaker || 'None'} ·{' '}
                      {ws.results_locked
                        ? <span style={{color:'#dc2626'}}>🔒 Locked</span>
                        : <span style={{color:'#15803d'}}>🔓 Unlocked</span>
                      }
                    </div>
                  </div>
                </div>
                <button onClick={() => editRow(ws)} style={s.btnBlue}>Edit</button>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

const s = {
  success:{ background:'#dcfce7', color:'#15803d', borderRadius:8, padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.9rem' },
  error:{ background:'#fee2e2', color:'#dc2626', borderRadius:8, padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.9rem' },
  formCard:{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:14, padding:'1.5rem', marginBottom:'1.5rem' },
  formTitle:{ fontWeight:700, color:'#1f2937', marginBottom:'1rem' },
  formRow:{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'1rem' },
  field:{ display:'flex', flexDirection:'column', gap:'0.35rem', minWidth:180 },
  label:{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#6b7280' },
  input:{ padding:'0.65rem 0.9rem', border:'1.5px solid #e9d5ff', borderRadius:8, fontFamily:'inherit', fontSize:'0.9rem', outline:'none' },
  btnPurple:{ padding:'0.75rem 2rem', borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#db2777)', color:'#fff', border:'none', fontWeight:700, fontSize:'0.9rem', cursor:'pointer' },
  btnBlue:{ padding:'0.4rem 1rem', borderRadius:8, border:'none', background:'#dbeafe', color:'#1d4ed8', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' },
  empty:{ textAlign:'center', padding:'3rem', background:'#fff', borderRadius:14, border:'1px dashed #e9d5ff', color:'#9ca3af' },
  card:{ background:'#fff', borderRadius:14, border:'1px solid #e9d5ff', overflow:'hidden' },
  cardHeader:{ padding:'1rem 1.5rem', background:'#faf5ff', borderBottom:'1px solid #e9d5ff', fontSize:'0.85rem', fontWeight:600, color:'#7c3aed' },
  row:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.5rem', borderBottom:'1px solid #faf5ff', flexWrap:'wrap', gap:'0.75rem' },
  info:{ display:'flex', alignItems:'center', gap:'0.75rem' },
  nm:{ fontWeight:600, color:'#1f2937', fontSize:'0.95rem' },
  meta:{ fontSize:'0.78rem', color:'#9ca3af', marginTop:'0.1rem' },
}