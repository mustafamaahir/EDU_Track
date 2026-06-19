export default function WeekSelector({ weeks, selected, onChange }) {
  return (
    <div style={styles.wrap}>
      <span style={styles.icon}>📅</span>
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        style={styles.select}
      >
        <option value="">All weeks</option>
        {weeks.map(w => (
          <option key={w} value={w}>{w}</option>
        ))}
      </select>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    background: '#fff', border: '1.5px solid #e9d5ff',
    borderRadius: 10, padding: '0.45rem 0.9rem',
  },
  icon: { fontSize: '1rem' },
  select: {
    border: 'none', outline: 'none',
    fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 500,
    color: '#4b5563', background: 'transparent', cursor: 'pointer',
  },
}
