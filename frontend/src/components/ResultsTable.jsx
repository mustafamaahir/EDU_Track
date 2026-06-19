function gradeColor(grade) {
  return { A: '#15803d', B: '#1d4ed8', C: '#b45309', D: '#c2410c', F: '#dc2626' }[grade] || '#6b7280'
}
function gradeBg(grade) {
  return { A: '#dcfce7', B: '#dbeafe', C: '#fef9c3', D: '#ffedd5', F: '#fee2e2' }[grade] || '#f3f4f6'
}

export default function ResultsTable({ weekData }) {
  if (!weekData) return null

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>My Results — {weekData.week}</h3>
          <p style={styles.sub}>{weekData.class_name}</p>
        </div>
        <div style={styles.avgBlock}>
          <span style={styles.avgNum}>{weekData.average}%</span>
          <span style={styles.avgLabel}>Overall · Grade {weekData.overall_grade}</span>
          {weekData.rank && <span style={styles.rankPill}>🏅 Rank #{weekData.rank}</span>}
        </div>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            {['Subject', 'Score', 'Percentage', 'Grade'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weekData.subjects.map((s, i) => (
            <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
              <td style={{ ...styles.td, fontWeight: 600 }}>{s.subject}</td>
              <td style={{ ...styles.td, fontFamily: 'monospace' }}>{s.score}/{s.max_score}</td>
              <td style={{ ...styles.td, fontFamily: 'monospace', color: '#7c3aed', fontWeight: 600 }}>
                {s.percentage}%
              </td>
              <td style={styles.td}>
                <span style={{
                  ...styles.gradeBadge,
                  color: gradeColor(s.grade),
                  background: gradeBg(s.grade),
                }}>
                  {s.grade}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  card: {
    background: '#fff', borderRadius: 14,
    border: '1px solid #e9d5ff', overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(139,92,246,0.07)',
  },
  header: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #f3e8ff',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title:    { fontWeight: 700, fontSize: '1rem', color: '#1f2937' },
  sub:      { fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.15rem' },
  avgBlock: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' },
  avgNum:   { fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, color: '#7c3aed' },
  avgLabel: { fontSize: '0.72rem', color: '#9ca3af' },
  rankPill: {
    padding: '0.15rem 0.65rem', borderRadius: 999,
    background: '#f5f0ff', color: '#7c3aed',
    fontSize: '0.75rem', fontWeight: 600,
  },
  table:    { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '0.65rem 1.5rem',
    fontSize: '0.72rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    color: '#9ca3af', textAlign: 'left',
    background: '#faf5ff', borderBottom: '1px solid #f3e8ff',
  },
  td:       { padding: '0.85rem 1.5rem', fontSize: '0.9rem', color: '#374151' },
  rowEven:  { background: '#fff' },
  rowOdd:   { background: '#fdfaff' },
  gradeBadge: {
    display: 'inline-block', padding: '0.2rem 0.7rem',
    borderRadius: 6, fontSize: '0.8rem', fontWeight: 700,
  },
}
