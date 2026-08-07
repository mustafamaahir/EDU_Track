import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import WeekSelector from '../components/WeekSelector'
import ResultsTable from '../components/ResultsTable'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [weeks, setWeeks]           = useState([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [locked, setLocked]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    api.get('/results/weeks')
      .then(res => {
        const w = res.data.weeks
        setWeeks(w)
        if (w.length > 0) setSelectedWeek(w[w.length - 1])
        else setLoading(false)
      })
      .catch(() => { setError('Failed to load weeks.'); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!selectedWeek) return
    setLoading(true)
    setLocked(false)
    setError('')
    api.get(`/results/me?week=${encodeURIComponent(selectedWeek)}`)
      .then(res => setResults(res.data.results))
      .catch(err => {
        if (err.response?.data?.detail === 'LOCKED') setLocked(true)
        else setError('Failed to load results.')
      })
      .finally(() => setLoading(false))
  }, [selectedWeek])

  const displayedResults = results.filter(r => r.week === selectedWeek)

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>My Results</h1>
            <p style={styles.pageSub}>Welcome back, <strong>{user?.name}</strong> · {user?.class_name}</p>
          </div>
          {weeks.length > 0 && (
            <WeekSelector weeks={weeks} selected={selectedWeek} onChange={setSelectedWeek} />
          )}
        </div>

        {loading && <p style={styles.msg}>Loading results…</p>}
        {error   && <p style={{...styles.msg, color:'#dc2626'}}>{error}</p>}

        {locked && (
          <div style={styles.lockedBox}>
            <div style={{fontSize:'3rem', marginBottom:'1rem'}}>🔒</div>
            <h2 style={styles.lockedTitle}>Results Not Yet Available</h2>
            <p style={styles.lockedMsg}>
              Results for <strong>{selectedWeek}</strong> have not been released yet.
              Please contact the admin or check back later.
            </p>
          </div>
        )}

        {!loading && !locked && !error && weeks.length === 0 && (
          <div style={styles.empty}>
            <div style={{fontSize:'2.5rem'}}>📋</div>
            <p>No results available yet.</p>
          </div>
        )}

        {!loading && !locked && !error && displayedResults.length === 0 && weeks.length > 0 && (
          <div style={styles.empty}>
            <div style={{fontSize:'2.5rem'}}>📋</div>
            <p>No results for {selectedWeek} yet.</p>
            <p style={{fontSize:'0.85rem', color:'#9ca3af'}}>Check back after your teacher uploads results.</p>
          </div>
        )}

        {!loading && !locked && displayedResults.map(weekData => (
          <div key={weekData.week} style={{marginBottom:'2rem'}}>
            <ResultsTable weekData={weekData} />
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  page:{ minHeight:'100vh', background:'#fdf4ff', padding:'2rem 1rem' },
  container:{ maxWidth:860, margin:'0 auto' },
  pageHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'2rem' },
  pageTitle:{ fontFamily:'"Georgia",serif', fontSize:'1.75rem', color:'#1f2937', margin:0 },
  pageSub:{ color:'#6b7280', fontSize:'0.9rem', marginTop:'0.25rem' },
  msg:{ textAlign:'center', color:'#6b7280', padding:'2rem' },
  empty:{ textAlign:'center', padding:'4rem 2rem', background:'#fff', borderRadius:14, border:'1px dashed #e9d5ff', color:'#6b7280', lineHeight:1.8 },
  lockedBox:{ textAlign:'center', padding:'4rem 2rem', background:'#fff', borderRadius:16, border:'2px solid #e9d5ff', boxShadow:'0 4px 20px rgba(139,92,246,0.08)' },
  lockedTitle:{ fontFamily:'"Georgia",serif', fontSize:'1.4rem', color:'#1f2937', marginBottom:'0.75rem' },
  lockedMsg:{ color:'#6b7280', fontSize:'0.95rem', lineHeight:1.7, maxWidth:400, margin:'0 auto' },
}