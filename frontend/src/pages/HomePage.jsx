import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  { icon: '📊', title: 'Track Results',     desc: 'View your subject scores and percentages for every week in one place.' },
  { icon: '🏆', title: 'Weekly Top 3',      desc: 'The top 3 students in your class are celebrated on the leaderboard every week.' },
  { icon: '🔒', title: 'Secure & Private',  desc: 'Your results are only visible to you. Leaderboard shows only your class.' },
  { icon: '📱', title: 'Always Available',  desc: 'Access your results anytime, from any device.' },
]

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div>
      {/* ── Hero ── */}
      <section style={styles.hero}>
        <div style={styles.heroGlow} />
        <div style={styles.heroContent}>
          <div style={styles.badge}>🎓 Welcome to</div>
          <h1 style={styles.heroTitle}>
            {/* Replace with your school name */}
            Greenfield Academy
          </h1>
          <p style={styles.motto}>
            "Nurturing Excellence, Building Futures"
          </p>
          <p style={styles.heroDesc}>
            Your personal academic results portal. Check your scores, track your progress, 
            and see how you rank in your class — all in one place.
          </p>
          <div style={styles.heroBtns}>
            {user ? (
              <Link to="/dashboard" style={styles.btnPrimary}>View My Results →</Link>
            ) : (
              <>
                <Link to="/login" style={styles.btnPrimary}>Sign In to Your Account</Link>
                <Link to="/about" style={styles.btnSecondary}>Learn More</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={styles.features}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Everything you need to track your progress</h2>
          <div style={styles.featureGrid}>
            {FEATURES.map(f => (
              <div key={f.title} style={styles.featureCard}>
                <div style={styles.featureIcon}>{f.icon}</div>
                <h3 style={styles.featureTitle}>{f.title}</h3>
                <p style={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section style={styles.cta}>
          <div style={styles.container}>
            <div style={styles.ctaCard}>
              <h2 style={styles.ctaTitle}>Ready to check your results?</h2>
              <p style={styles.ctaDesc}>Sign in with the credentials provided by your school.</p>
              <Link to="/login" style={styles.btnPrimary}>Sign In Now →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} Greenfield Academy · EduTrack Portal</p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.78rem', color: '#c4b5fd' }}>
          For technical support, contact the school administration.
        </p>
      </footer>
    </div>
  )
}

const styles = {
  hero: {
    position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(145deg, #1e0a3c 0%, #4c1d95 50%, #831843 100%)',
    padding: '6rem 1.5rem 5rem',
    textAlign: 'center',
  },
  heroGlow: {
    position: 'absolute', top: '-60px', left: '50%',
    transform: 'translateX(-50%)',
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: { position: 'relative', maxWidth: 680, margin: '0 auto' },
  badge: {
    display: 'inline-block', marginBottom: '1rem',
    padding: '0.3rem 1rem', borderRadius: 999,
    background: 'rgba(255,255,255,0.1)',
    color: '#f9a8d4', fontSize: '0.9rem', fontWeight: 500,
    border: '1px solid rgba(255,255,255,0.15)',
  },
  heroTitle: {
    fontFamily: '"Georgia", serif',
    fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
    fontWeight: 700, color: '#fff',
    lineHeight: 1.15, marginBottom: '0.5rem',
  },
  motto: {
    fontStyle: 'italic', color: '#f9a8d4',
    fontSize: '1.05rem', marginBottom: '1.25rem',
  },
  heroDesc: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: '1.05rem', lineHeight: 1.7,
    marginBottom: '2.5rem',
  },
  heroBtns: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: {
    padding: '0.85rem 2rem', borderRadius: 10,
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    color: '#fff', fontWeight: 700, fontSize: '0.95rem',
    textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
  },
  btnSecondary: {
    padding: '0.85rem 2rem', borderRadius: 10,
    border: '1.5px solid rgba(255,255,255,0.3)',
    color: '#fff', fontWeight: 600, fontSize: '0.95rem',
    textDecoration: 'none',
  },
  features: { padding: '5rem 1.5rem', background: '#fdf4ff' },
  container: { maxWidth: 1000, margin: '0 auto' },
  sectionTitle: {
    fontFamily: '"Georgia", serif',
    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
    textAlign: 'center', color: '#1f2937',
    marginBottom: '3rem',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
  },
  featureCard: {
    background: '#fff', borderRadius: 14,
    border: '1px solid #e9d5ff', padding: '1.75rem 1.5rem',
    boxShadow: '0 2px 12px rgba(139,92,246,0.07)',
  },
  featureIcon:  { fontSize: '2rem', marginBottom: '0.75rem' },
  featureTitle: { fontWeight: 700, fontSize: '1rem', color: '#1f2937', marginBottom: '0.5rem' },
  featureDesc:  { fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 },
  cta:          { padding: '3rem 1.5rem', background: '#fff' },
  ctaCard: {
    background: 'linear-gradient(135deg, #7c3aed, #db2777)',
    borderRadius: 20, padding: '3rem 2rem', textAlign: 'center',
    maxWidth: 640, margin: '0 auto',
  },
  ctaTitle: { color: '#fff', fontFamily: '"Georgia", serif', fontSize: '1.75rem', marginBottom: '0.75rem' },
  ctaDesc:  { color: 'rgba(255,255,255,0.8)', marginBottom: '1.75rem', fontSize: '1rem' },
  footer: {
    background: '#1e0a3c', color: '#c4b5fd',
    textAlign: 'center', padding: '2rem 1.5rem',
    fontSize: '0.85rem',
  },
}
