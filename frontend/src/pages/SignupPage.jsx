import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'

const CLASSES = ['Form 1A', 'Form 1B', 'Form 2A', 'Form 2B', 'Form 3A', 'Form 3B']

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', confirm: '', name: '', class_name: '' })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(field, value) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (!form.class_name) {
      setError('Please select your class.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/signup', {
        username:   form.username.trim().toLowerCase(),
        password:   form.password,
        name:       form.name.trim(),
        class_name: form.class_name,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={styles.title}>Account Created!</h2>
            <p style={styles.successMsg}>
              Your account is <strong>pending approval</strong> by the school admin.
              You'll be able to log in once your account has been approved.
            </p>
            <Link to="/login" style={styles.btnPrimary}>Back to Login</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link to="/login" style={styles.backLink}>← Back to Login</Link>

        <div style={styles.logoArea}>
          <div style={{ fontSize: '2rem' }}>🎓</div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Register to access your results</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              style={styles.input}
              placeholder="e.g. Alice Mensah"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              style={styles.input}
              placeholder="e.g. alice"
              required
              autoComplete="username"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Class</label>
            <select
              value={form.class_name}
              onChange={e => set('class_name', e.target.value)}
              style={styles.input}
              required
            >
              <option value="">Select your class</option>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                style={styles.input}
                placeholder="Min. 6 characters"
                required
                autoComplete="new-password"
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                style={styles.input}
                placeholder="Repeat password"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.btnPrimary}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={styles.hint}>
          Already have an account? <Link to="/login" style={{ color: '#7c3aed' }}>Sign in</Link>
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
    width: '100%', maxWidth: 480,
    boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
  },
  backLink:   { fontSize: '0.82rem', color: '#9ca3af', textDecoration: 'none', display: 'block', marginBottom: '1.5rem' },
  logoArea:   { textAlign: 'center', marginBottom: '1.75rem' },
  title:      { fontFamily: '"Georgia", serif', fontSize: '1.6rem', color: '#7c3aed', margin: '0.25rem 0' },
  subtitle:   { color: '#9ca3af', fontSize: '0.875rem' },
  field:      { marginBottom: '1rem' },
  row:        { display: 'flex', gap: '0.75rem' },
  label: {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.05em',
    color: '#6b7280', marginBottom: '0.4rem',
  },
  input: {
    width: '100%', padding: '0.7rem 0.9rem',
    border: '1.5px solid #e9d5ff', borderRadius: 10,
    fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box',
  },
  error: {
    background: '#fee2e2', color: '#dc2626', borderRadius: 8,
    padding: '0.65rem 1rem', fontSize: '0.85rem', marginBottom: '1rem',
  },
  successMsg: {
    color: '#6b7280', lineHeight: 1.7, fontSize: '0.95rem',
    marginBottom: '1.75rem',
  },
  btnPrimary: {
    display: 'block', width: '100%', padding: '0.875rem',
    background: 'linear-gradient(135deg, #7c3aed, #db2777)',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box',
  },
  hint: { textAlign: 'center', fontSize: '0.82rem', color: '#9ca3af', marginTop: '1.25rem' },
}
