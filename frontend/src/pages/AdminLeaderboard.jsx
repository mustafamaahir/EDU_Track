import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Podium from '../components/Podium'

export default function AdminLeaderboard() {
  const { user } = useAuth()
  const [myClasses, setMyClasses] = useState([])
  const [weeks, setWeeks]           = useState([])
  const [selectedWeek, setWeek]     = useState('')
  const [selectedClass, setClass]   = useState('')
  const [leaderboard, setLeaderboard] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if(user?.role === 'superadmin') {
      setMyClasses(['Dhahab','Fidda','Ihsaan','Thaqaafah','Thawaab','Taqwah', 'Rawda', 'Dhikr'])
    } else {
      api.get('/admin/my-classes').then(r => setMyClasses(r.data.classes))
    }
    api.get('/results/weeks').then(r => {
      const w = r.data.weeks
      setWeeks(w)
      if (w.length > 0) setWeek(w[w.length - 1])
    })
  }, [])

  useEffect(() => {
    if (!selectedWeek || !selectedClass) return
    setLoading(true); setError('')
    api.get(`/leaderboard/admin/${encodeURIComponent(selectedWeek)}?class_name=${encodeURIComponent(selectedClass)}`)
      .then(r => setLeaderboard(r.data))
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false))
  }, [selectedWeek, selectedClass])

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Class Leaderboard</h1>

        <div style={styles.filters}>
          <div style={styles.field}>
            <label style={styles.label}>Week</label>
            <select value={selectedWeek} onChange={e => setWeek(e.target.value)} style={styles.input}>
              <option value="">Select week</option>
              {weeks.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Class</label>
            <select value={selectedClass} onChange={e => setClass(e.target.value)} style={styles.input}>
              <option value="">Select class</option>
              {myClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {!selectedWeek || !selectedClass ? (
          <div style={styles.empty}>
            <div style={{fontSize:'2rem'}}>🏆</div>
            <p>Select a week and class to view the leaderboard.</p>
          </div>
        ) : loading ? (
          <p style={styles.msg}>Loading...</p>
        ) : error ? (
          <p style={{...styles.msg, color:'#dc2626'}}>{error}</p>
        ) : leaderboard ? (
          <div style={styles.podiumWrap}>
            <h2 style={styles.podiumTitle}>
              Top 3 — {selectedClass} · {selectedWeek}
            </h2>
            <Podium top3={leaderboard.top3} />

            {leaderboard.top3?.length > 0 && (
              <div style={styles.fullList}>
                {leaderboard.top3.map((entry, i) => (
                  <div key={i} style={styles.listRow}>
                    <span style={styles.rank}>#{entry.rank}</span>
                    <span style={styles.name}>{entry.student_name}</span>
                    <span style={styles.score}>{entry.average}%</span>
                    <span style={{
                      ...styles.grade,
                      color: entry.grade==='A'?'#15803d':entry.grade==='B'?'#1d4ed8':'#b45309',
                      background: entry.grade==='A'?'#dcfce7':entry.grade==='B'?'#dbeafe':'#fef9c3',
                    }}>{entry.grade}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

const styles = {
  page:{ minHeight:'100vh', background:'#fdf4ff', padding:'2.5rem 1.5rem' },
  container:{ maxWidth:860, margin:'0 auto' },
  title:{ fontFamily:'"Georgia",serif', fontSize:'1.75rem', color:'#1f2937', marginBottom:'1.5rem' },
  filters:{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'2rem' },
  field:{ display:'flex', flexDirection:'column', gap:'0.35rem', minWidth:200 },
  label:{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'#6b7280' },
  input:{ padding:'0.65rem 0.9rem', border:'1.5px solid #e9d5ff', borderRadius:8, fontFamily:'inherit', fontSize:'0.9rem', outline:'none' },
  empty:{ textAlign:'center', padding:'4rem', background:'#fff', borderRadius:14, border:'1px dashed #e9d5ff', color:'#9ca3af' },
  msg:{ textAlign:'center', color:'#6b7280', padding:'2rem' },
  podiumWrap:{ background:'#fff', borderRadius:16, padding:'2.5rem 2rem', border:'1px solid #e9d5ff' },
  podiumTitle:{ fontFamily:'"Georgia",serif', fontSize:'1.25rem', textAlign:'center', color:'#1f2937', marginBottom:'2rem' },
  fullList:{ marginTop:'2rem', borderTop:'1px solid #f3e8ff', paddingTop:'1.5rem' },
  listRow:{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.75rem 0', borderBottom:'1px solid #faf5ff' },
  rank:{ fontWeight:700, color:'#7c3aed', minWidth:30, fontFamily:'monospace' },
  name:{ flex:1, fontWeight:500, color:'#1f2937' },
  score:{ fontFamily:'monospace', fontWeight:700, color:'#7c3aed' },
  grade:{ padding:'0.2rem 0.7rem', borderRadius:6, fontSize:'0.78rem', fontWeight:700 },
}
