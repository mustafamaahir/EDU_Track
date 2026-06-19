import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import WeekSelector from '../components/WeekSelector'
import ResultsTable from '../components/ResultsTable'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [weeks, setWeeks] = useState([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load available weeks on mount
  useEffect(() => {
    api.get('/results/weeks')
      .then(res => {
        const w = res.data.weeks
        setWeeks(w)
        if (w.length > 0) setSelectedWeek(w[w.length - 1]) // default to latest
      })
      .catch(() => setError('Failed to load weeks.'))
  }, [])

  // Load results when week changes
  useEffect(() => {
    setLoading(true)
    setError('')
    const params = selectedWeek ? `?week=${encodeURIComponent(selectedWeek)}` : ''
    api.get(`/results/me${params}`)
      .then(res => setResults(res.data.results))
      .catch(() => setError('Failed to load results.'))
      .finally(() => setLoading(false))
  }, [selectedWeek])

  const displayedResults = selectedWeek
    ? results.filter(r => r.week === selectedWeek)
    : results

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Page header */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>My Results</h1>
            <p style={styles.pageSub}>
              Welcome back, <strong>{user?.name}</strong> · {user?.class_name}
            </p>
          </div>
          <WeekSelector weeks={weeks} selected={selectedWeek} onChange={setSelectedWeek} />
        </div>

        {/* Content */}
        {loading && <p style={styles.msg}>Loading results…</p>}
        {error  && <p style={{ ...styles.msg, color: '#dc2626' }}>{error}</p>}

        {!loading && !error && displayedResults.length === 0 && (
          <div style={styles.empty}>
            <div style={{ fontSize: '2.5rem' }}>📋</div>
            <p>No results uploaded for this week yet.</p>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Check back after your teacher uploads this week's results.</p>
          </div>
        )}

        {!loading && displayedResults.map(weekData => (
          <div key={weekData.week} style={{ marginBottom: '2rem' }}>
            <ResultsTable weekData={weekData} />
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  page:      { minHeight: '100vh', background: '#fdf4ff', padding: '2.5rem 1.5rem' },
  container: { maxWidth: 860, margin: '0 auto' },
  pageHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem',
  },
  pageTitle: {
    fontFamily: '"Georgia", serif',
    fontSize: '1.75rem', color: '#1f2937', margin: 0,
  },
  pageSub:   { color: '#6b7280', fontSize: '0.9rem', marginTop: '0.25rem' },
  msg:       { textAlign: 'center', color: '#6b7280', padding: '2rem' },
  empty: {
    textAlign: 'center', padding: '4rem 2rem',
    background: '#fff', borderRadius: 14, border: '1px dashed #e9d5ff',
    color: '#6b7280', lineHeight: 1.8,
  },
}
