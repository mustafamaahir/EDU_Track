import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import Podium from '../components/Podium'
import WeekSelector from '../components/WeekSelector'

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [weeks, setWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [leaderboard, setLeaderboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/results/weeks')
      .then(res => {
        const w = res.data.weeks
        setWeeks(w)
        if (w.length > 0) setSelectedWeek(w[w.length - 1])
      })
      .catch(() => setError('Failed to load weeks.'))
  }, [])

  useEffect(() => {
    if (!selectedWeek) return
    setLoading(true)
    setError('')
    api.get(`/leaderboard/${encodeURIComponent(selectedWeek)}`)
      .then(res => setLeaderboard(res.data))
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false))
  }, [selectedWeek])

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Leaderboard</h1>
            <p style={styles.pageSub}>
              Top performers in <strong>{user?.class_name}</strong>
            </p>
          </div>
          <WeekSelector weeks={weeks} selected={selectedWeek} onChange={setSelectedWeek} />
        </div>

        {/* Class badge */}
        <div style={styles.classBanner}>
          🏫 Showing results for <strong style={{ color: '#7c3aed' }}>{user?.class_name}</strong>
        </div>

        {/* Podium */}
        <div style={styles.podiumWrap}>
          {loading && <p style={styles.msg}>Loading leaderboard…</p>}
          {error   && <p style={{ ...styles.msg, color: '#dc2626' }}>{error}</p>}
          {!loading && !error && leaderboard && (
            <>
              <h2 style={styles.podiumTitle}>🏆 Top 3 — {selectedWeek}</h2>
              <Podium top3={leaderboard.top3} />
            </>
          )}
        </div>

        {/* Full ranked list */}
        {!loading && leaderboard?.top3?.length > 0 && (
          <div style={styles.fullList}>
            <h3 style={styles.listTitle}>Full Rankings</h3>
            <div style={styles.listCard}>
              {leaderboard.top3.map((entry, i) => {
                const isMe = entry.student_name === user?.name
                return (
                  <div key={i} style={{ ...styles.listRow, ...(isMe ? styles.listRowMe : {}) }}>
                    <span style={styles.listRank}>#{entry.rank}</span>
                    <span style={styles.listName}>
                      {entry.student_name}
                      {isMe && <span style={styles.youTag}>you</span>}
                    </span>
                    <span style={styles.listScore}>{entry.average}%</span>
                    <span style={{
                      ...styles.gradeBadge,
                      color: entry.grade === 'A' ? '#15803d' : entry.grade === 'B' ? '#1d4ed8' : '#b45309',
                      background: entry.grade === 'A' ? '#dcfce7' : entry.grade === 'B' ? '#dbeafe' : '#fef9c3',
                    }}>
                      {entry.grade}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page:      { minHeight: '100vh', background: '#fdf4ff', padding: '2.5rem 1.5rem' },
  container: { maxWidth: 860, margin: '0 auto' },
  pageHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem',
  },
  pageTitle: { fontFamily: '"Georgia", serif', fontSize: '1.75rem', color: '#1f2937', margin: 0 },
  pageSub:   { color: '#6b7280', fontSize: '0.9rem', marginTop: '0.25rem' },
  classBanner: {
    background: '#f5f0ff', border: '1px solid #e9d5ff',
    borderRadius: 10, padding: '0.65rem 1.25rem',
    fontSize: '0.875rem', color: '#4b5563',
    marginBottom: '2rem',
  },
  podiumWrap: {
    background: '#fff', borderRadius: 16, padding: '2.5rem 2rem',
    border: '1px solid #e9d5ff', marginBottom: '2rem',
    boxShadow: '0 2px 16px rgba(139,92,246,0.08)',
  },
  podiumTitle: {
    fontFamily: '"Georgia", serif',
    fontSize: '1.25rem', textAlign: 'center',
    color: '#1f2937', marginBottom: '2rem',
  },
  msg:      { textAlign: 'center', color: '#6b7280', padding: '2rem' },
  fullList: { marginBottom: '2rem' },
  listTitle: { fontWeight: 700, fontSize: '1rem', color: '#1f2937', marginBottom: '0.75rem' },
  listCard:  { background: '#fff', borderRadius: 14, border: '1px solid #e9d5ff', overflow: 'hidden' },
  listRow: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    padding: '0.875rem 1.5rem', borderBottom: '1px solid #faf5ff',
  },
  listRowMe: { background: '#faf5ff' },
  listRank:  { fontWeight: 700, color: '#7c3aed', minWidth: 30, fontFamily: 'monospace' },
  listName:  { flex: 1, fontWeight: 500, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  youTag: {
    padding: '0.1rem 0.5rem', borderRadius: 999,
    background: '#e9d5ff', color: '#7c3aed',
    fontSize: '0.7rem', fontWeight: 700,
  },
  listScore:  { fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed' },
  gradeBadge: {
    padding: '0.2rem 0.7rem', borderRadius: 6,
    fontSize: '0.78rem', fontWeight: 700,
  },
}
