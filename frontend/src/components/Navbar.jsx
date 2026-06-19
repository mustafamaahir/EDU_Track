import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { label: 'Home',        path: '/' },
  { label: 'Results',     path: '/dashboard',   auth: true },
  { label: 'Leaderboard', path: '/leaderboard', auth: true },
  { label: 'About',       path: '/about' },
  { label: 'Contact',     path: '/contact' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = React.useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  const visibleLinks = NAV_LINKS.filter(l => !l.auth || user)

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🎓</span>
          <span>EduTrack</span>
        </Link>

        {/* Desktop links */}
        <div style={styles.links}>
          {visibleLinks.map(l => (
            <Link
              key={l.path}
              to={l.path}
              style={{
                ...styles.link,
                ...(location.pathname === l.path ? styles.linkActive : {})
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth area */}
        <div style={styles.authArea}>
          {user ? (
            <>
              <div style={styles.userChip}>
                <div style={styles.avatar}>{user.name.split(' ').map(w => w[0]).join('')}</div>
                <div style={styles.userMeta}>
                  <span style={styles.userName}>{user.name}</span>
                  <span style={styles.userClass}>{user.class_name}</span>
                </div>
              </div>
              <button onClick={handleLogout} style={styles.btnLogout}>Sign out</button>
            </>
          ) : (
            <Link to="/login" style={styles.btnLogin}>Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  )
}

// Inline styles for portability
import React from 'react'

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #f0e6ff',
    boxShadow: '0 2px 16px rgba(139,92,246,0.08)',
  },
  inner: {
    maxWidth: 1100, margin: '0 auto',
    padding: '0 1.5rem', height: 64,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '1rem',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontFamily: '"Georgia", serif', fontSize: '1.3rem', fontWeight: 700,
    color: '#7c3aed', textDecoration: 'none',
  },
  logoIcon: { fontSize: '1.4rem' },
  links: { display: 'flex', alignItems: 'center', gap: '0.25rem' },
  link: {
    padding: '0.4rem 0.85rem', borderRadius: 8,
    fontSize: '0.9rem', fontWeight: 500,
    color: '#4b5563', textDecoration: 'none',
    transition: 'all 0.15s',
  },
  linkActive: {
    background: '#f5f0ff', color: '#7c3aed', fontWeight: 600,
  },
  authArea: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  userChip: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.8rem',
  },
  userMeta: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '0.85rem', fontWeight: 600, color: '#1f2937', lineHeight: 1.2 },
  userClass: { fontSize: '0.7rem', color: '#9ca3af' },
  btnLogout: {
    padding: '0.4rem 1rem', borderRadius: 8,
    border: '1.5px solid #e9d5ff', background: 'transparent',
    fontSize: '0.82rem', fontWeight: 500, color: '#7c3aed',
    cursor: 'pointer',
  },
  btnLogin: {
    padding: '0.5rem 1.25rem', borderRadius: 8,
    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    color: '#fff', fontSize: '0.9rem', fontWeight: 600,
    textDecoration: 'none',
  },
}
