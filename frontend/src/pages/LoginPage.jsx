import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.username.trim().toLowerCase(), form.password)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch {
      setError('Incorrect username or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link to="/" style={styles.backLink}>← Back to Home</Link>

        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🎓</div>
          <h1 style={styles.title}>EduTrack</h1>
          <p style={styles.subtitle}>Sign in to view your results</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              style={styles.input}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              style={styles.input}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={styles.hint}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#7c3aed', fontWeight: 600 }}>Sign up here</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(145deg, #1e0a3c 0%, #4c1d95 50%, #831843 100%)',
    padding: '1.5rem',
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '2.5rem 2rem',
    width: '100%', maxWidth: 420,
    boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
  },
  backLink: { fontSize: '0.82rem', color: '#9ca3af', textDecoration: 'none', display: 'block', marginBottom: '1.5rem' },
  logoArea: { textAlign: 'center', marginBottom: '2rem' },
  logoIcon: { fontSize: '2.5rem', marginBottom: '0.25rem' },
  title: {
    fontFamily: '"Georgia", serif',
    fontSize: '1.75rem', color: '#7c3aed', margin: 0,
  },
  subtitle: { color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' },
  field:    { marginBottom: '1.25rem' },
  label: {
    display: 'block', fontSize: '0.78rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    color: '#6b7280', marginBottom: '0.5rem',
  },
  input: {
    width: '100%', padding: '0.75rem 1rem',
    border: '1.5px solid #e9d5ff', borderRadius: 10,
    fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box',
  },
  error: {
    background: '#fee2e2', color: '#dc2626',
    borderRadius: 8, padding: '0.65rem 1rem',
    fontSize: '0.85rem', marginBottom: '1rem',
  },
  btn: {
    width: '100%', padding: '0.875rem',
    background: 'linear-gradient(135deg, #7c3aed, #db2777)',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    marginTop: '0.25rem',
  },
  hint: {
    textAlign: 'center', fontSize: '0.78rem',
    color: '#9ca3af', marginTop: '1.5rem',
  },
}
