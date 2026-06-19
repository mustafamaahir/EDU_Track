export function AboutPage() {
  return (
    <div style={pg}>
      <div style={wrap}>
        <h1 style={title}>About EduTrack</h1>
        <p style={body}>
          EduTrack is the official student results portal of <strong>Greenfield Academy</strong>.
          It provides students with secure, instant access to their academic results each week.
        </p>
        <div style={grid}>
          {[
            { h: 'Our Mission',  t: 'To keep every student informed about their academic progress in a clear, timely, and private way.' },
            { h: 'How It Works', t: 'Teachers upload results each week. Students log in to see their scores, percentages, and class ranking.' },
            { h: 'Data Privacy',  t: 'Each student can only see their own results. Leaderboards are restricted to your class only.' },
          ].map(c => (
            <div key={c.h} style={card}>
              <h3 style={cardTitle}>{c.h}</h3>
              <p style={cardText}>{c.t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ContactPage() {
  return (
    <div style={pg}>
      <div style={{ ...wrap, maxWidth: 600 }}>
        <h1 style={title}>Contact Us</h1>
        <p style={body}>For any issues accessing your account or your results, please reach out through one of these channels.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          {[
            { icon: '🏫', label: 'School Office',    val: 'Visit the main office between 8am – 3pm on school days.' },
            { icon: '📧', label: 'Email',             val: 'admin@greenfield.edu.gh' },
            { icon: '📞', label: 'Phone',             val: '+233 XX XXX XXXX' },
          ].map(c => (
            <div key={c.label} style={contactRow}>
              <span style={{ fontSize: '1.75rem' }}>{c.icon}</span>
              <div>
                <div style={{ fontWeight: 700, color: '#1f2937' }}>{c.label}</div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{c.val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const pg   = { minHeight: '100vh', background: '#fdf4ff', padding: '3rem 1.5rem' }
const wrap = { maxWidth: 860, margin: '0 auto' }
const title = { fontFamily: '"Georgia", serif', fontSize: '2rem', color: '#1f2937', marginBottom: '1rem' }
const body  = { color: '#6b7280', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2.5rem' }
const grid  = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }
const card  = { background: '#fff', border: '1px solid #e9d5ff', borderRadius: 14, padding: '1.5rem' }
const cardTitle = { fontWeight: 700, color: '#7c3aed', marginBottom: '0.5rem' }
const cardText  = { fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }
const contactRow = {
  display: 'flex', alignItems: 'flex-start', gap: '1rem',
  background: '#fff', border: '1px solid #e9d5ff',
  borderRadius: 12, padding: '1.25rem 1.5rem',
}
