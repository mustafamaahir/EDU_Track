export default function Podium({ top3 }) {
  if (!top3 || top3.length === 0) {
    return <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No results for this week yet.</p>
  }

  const medals = ['🥇', '🥈', '🥉']
  const order  = [1, 0, 2] // silver, gold, bronze — podium layout

  return (
    <div style={styles.podium}>
      {order.map(i => {
        const entry = top3[i]
        if (!entry) return <div key={i} style={{ flex: 1 }} />
        const isGold = i === 0
        return (
          <div key={i} style={{ ...styles.card, ...(isGold ? styles.goldCard : {}) }}>
            <span style={styles.medal}>{medals[i]}</span>
            <div style={styles.name}>{entry.student_name}</div>
            <div style={styles.score}>{entry.average}%</div>
            <div style={styles.gradeLabel}>Average · Grade {entry.grade}</div>
            <span style={styles.classBadge}>{entry.class_name}</span>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  podium: {
    display: 'flex', alignItems: 'flex-end',
    justifyContent: 'center', gap: '1rem',
  },
  card: {
    flex: 1, maxWidth: 200,
    background: '#fff', border: '2px solid #e9d5ff',
    borderRadius: 16, padding: '1.5rem 1rem',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(139,92,246,0.1)',
    transition: 'transform 0.2s',
  },
  goldCard: {
    border: '2px solid #f59f00',
    background: 'linear-gradient(160deg, #fffbeb, #fef3c7)',
    transform: 'translateY(-12px)',
    boxShadow: '0 8px 32px rgba(245,159,0,0.2)',
  },
  medal:      { fontSize: '2rem', display: 'block', marginBottom: '0.5rem' },
  name:       { fontWeight: 700, fontSize: '0.95rem', color: '#1f2937', marginBottom: '0.25rem' },
  score:      { fontSize: '1.6rem', fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace' },
  gradeLabel: { fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.15rem' },
  classBadge: {
    display: 'inline-block', marginTop: '0.6rem',
    padding: '0.2rem 0.7rem', borderRadius: 999,
    background: '#f5f0ff', color: '#7c3aed',
    fontSize: '0.72rem', fontWeight: 600,
  },
}
