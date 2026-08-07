import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import Podium from '../components/Podium'
import WeekSelector from '../components/WeekSelector'

export default function LeaderboardPage() {
  const { user }                    = useAuth()
  const [weeks, setWeeks]           = useState([])
  const [selectedWeek, setWeek]     = useState('')
  const [leaderboard, setLeaderboard] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [locked, setLocked]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    api.get('/results/weeks').then(res => {
      const w = res.data.weeks
      setWeeks(w)
      if (w.length > 0) setWeek(w[w.length - 1])
    })
  }, [])

  useEffect(() => {
    if (!selectedWeek) return
    setLoading(true); setError(''); setLocked(false)
    api.get(`/leaderboard/student/${encodeURIComponent(selectedWeek)}`)
      .then(res => setLeaderboard(res.data))
      .catch(err => {
        if (err.response?.data?.detail === 'LOCKED') setLocked(true)
        else setError('Failed to load leaderboard.')
      })
      .finally(() => setLoading(false))
  }, [selectedWeek])

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Leaderboard</h1>
            <p style={styles.pageSub}>Top performers in <strong>{user?.class_name}</strong></p>
          </div>
          {weeks.length > 0 && (
            <WeekSelector weeks={weeks} selected={selectedWeek} onChange={setWeek} />
          )}
        </div>

        {loading && <p style={styles.msg}>Loading…</p>}
        {error   && <p style={{...styles.msg, color:'#dc2626'}}>{error}</p>}

        {locked && (
          <div style={styles.lockedBox}>
            <div style={{fontSize:'3rem', marginBottom:'1rem'}}>🔒</div>
            <h2 style={styles.lockedTitle}>Leaderboard Not Yet Available</h2>
            <p style={styles.lockedMsg}>
              The leaderboard for <strong>{selectedWeek}</strong> has not been released yet.
              Please contact the admin or check back later.
            </p>
          </div>
        )}

        {!loading && !locked && leaderboard && (
          <>
            <div style={styles.classBanner}>
              🏫 Showing results for <strong style={{color:'#7c3aed'}}>{user?.class_name}</strong>
              {leaderboard.tiebreaker && (
                <span style={styles.tiebreakerBadge}>Tiebreaker: {leaderboard.tiebreaker}</span>
              )}
            </div>
            <div style={styles.podiumWrap}>
              <h2 style={styles.podiumTitle}>🏆 Top 3 — {selectedWeek}</h2>
              <Podium top3={leaderboard.top3} />

              {leaderboard.top3?.length > 0 && (
                <div style={styles.fullList}>
                  {leaderboard.top3.map((entry, i) => {
                    const isMe = entry.student_name === user?.name
                    return (
                      <div key={i} style={{...styles.listRow,...(isMe?styles.listRowMe:{})}}>
                        <span style={styles.rank}>#{entry.rank}</span>
                        <span style={styles.name}>
                          {entry.student_name}
                          {isMe && <span style={styles.youTag}>you</span>}
                        </span>
                        <span style={styles.score}>{entry.average}%</span>
                        {leaderboard.tiebreaker && (
                          <span style={styles.tbScore}>{leaderboard.tiebreaker}: {entry.tiebreaker_score?.toFixed(1)}%</span>
                        )}
                        <span style={{
                          ...styles.grade,
                          color: entry.grade==='A'?'#15803d':entry.grade==='B'?'#1d4ed8':'#b45309',
                          background: entry.grade==='A'?'#dcfce7':entry.grade==='B'?'#dbeafe':'#fef9c3',
                        }}>{entry.grade}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  page:{ minHeight:'100vh', background:'#fdf4ff', padding:'2rem 1rem' },
  container:{ maxWidth:860, margin:'0 auto' },
  pageHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' },
  pageTitle:{ fontFamily:'"Georgia",serif', fontSize:'1.75rem', color:'#1f2937', margin:0 },
  pageSub:{ color:'#6b7280', fontSize:'0.9rem', marginTop:'0.25rem' },
  classBanner:{ background:'#f5f0ff', border:'1px solid #e9d5ff', borderRadius:10, padding:'0.65rem 1.25rem', fontSize:'0.875rem', color:'#4b5563', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' },
  tiebreakerBadge:{ padding:'0.2rem 0.7rem', background:'#7c3aed', color:'#fff', borderRadius:999, fontSize:'0.75rem', fontWeight:600 },
  podiumWrap:{ background:'#fff', borderRadius:16, padding:'2rem 1.5rem', border:'1px solid #e9d5ff', marginBottom:'2rem' },
  podiumTitle:{ fontFamily:'"Georgia",serif', fontSize:'1.25rem', textAlign:'center', color:'#1f2937', marginBottom:'2rem' },
  msg:{ textAlign:'center', color:'#6b7280', padding:'2rem' },
  lockedBox:{ textAlign:'center', padding:'4rem 2rem', background:'#fff', borderRadius:16, border:'2px solid #e9d5ff', boxShadow:'0 4px 20px rgba(139,92,246,0.08)' },
  lockedTitle:{ fontFamily:'"Georgia",serif', fontSize:'1.4rem', color:'#1f2937', marginBottom:'0.75rem' },
  lockedMsg:{ color:'#6b7280', fontSize:'0.95rem', lineHeight:1.7, maxWidth:400, margin:'0 auto' },
  fullList:{ marginTop:'2rem', borderTop:'1px solid #f3e8ff', paddingTop:'1.5rem' },
  listRow:{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.75rem 0', borderBottom:'1px solid #faf5ff', flexWrap:'wrap' },
  listRowMe:{ background:'#faf5ff', borderRadius:8, padding:'0.75rem 0.5rem' },
  rank:{ fontWeight:700, color:'#7c3aed', minWidth:30, fontFamily:'monospace' },
  name:{ flex:1, fontWeight:500, color:'#1f2937', display:'flex', alignItems:'center', gap:'0.5rem' },
  youTag:{ padding:'0.1rem 0.5rem', borderRadius:999, background:'#e9d5ff', color:'#7c3aed', fontSize:'0.7rem', fontWeight:700 },
  score:{ fontFamily:'monospace', fontWeight:700, color:'#7c3aed' },
  tbScore:{ fontSize:'0.78rem', color:'#9ca3af' },
  grade:{ padding:'0.2rem 0.7rem', borderRadius:6, fontSize:'0.78rem', fontWeight:700 },
}
