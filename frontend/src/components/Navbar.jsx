import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin   = user?.role === 'admin' || user?.role === 'superadmin'
  const isStudent = user?.role === 'student'

  const NAV_LINKS = [
    { label: 'Home',        path: '/' },
    ...(isStudent ? [
      { label: 'Results',     path: '/dashboard' },
    ] : []),
    ...(isAdmin ? [
      { label: 'Dashboard',   path: '/admin' },
      { label: 'Leaderboard', path: '/admin/leaderboard' },
    ] : []),
    { label: 'About',   path: '/about' },
    { label: 'Contact', path: '/contact' },
    ...(!user ? [{ label: 'Login', path: '/login' }] : []),
  ]

  function handleLogout() { logout(); navigate('/'); setMenuOpen(false) }

  return (
    <>
      <nav style={st.nav}>
        <div style={st.inner}>
          <Link to="/" style={st.logo} onClick={() => setMenuOpen(false)}>
            <span>🎓</span><span>EduTrack</span>
          </Link>

          <div className="nav-desktop" style={st.desktopLinks}>
            {NAV_LINKS.map(l => (
              <Link key={l.path} to={l.path}
                style={{...st.link,...(location.pathname===l.path?st.active:{})}}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="nav-auth" style={st.authArea}>
            {user && (
              <>
                <div style={st.userChip}>
                  <div style={st.avatar}>{user.name.split(' ').map(w=>w[0]).join('')}</div>
                  <div style={st.userMeta}>
                    <div style={st.userName}>{user.name}</div>
                    <div style={st.userRole}>{user.role}</div>
                  </div>
                </div>
                <button onClick={handleLogout} style={st.btnOut}>Sign out</button>
              </>
            )}
          </div>

          <button className="nav-hamburger" style={st.hamburger}
            onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <div style={st.mobileMenu}>
            {NAV_LINKS.map(l => (
              <Link key={l.path} to={l.path}
                onClick={() => setMenuOpen(false)}
                style={{...st.mobileLink,...(location.pathname===l.path?st.mobileLinkActive:{})}}>
                {l.label}
              </Link>
            ))}
            {user && (
              <>
                <div style={st.mobileDivider} />
                <div style={st.mobileUser}>
                  <div style={st.avatar}>{user.name.split(' ').map(w=>w[0]).join('')}</div>
                  <div>
                    <div style={st.userName}>{user.name}</div>
                    <div style={st.userRole}>{user.role}</div>
                  </div>
                </div>
                <button onClick={handleLogout} style={st.mobileLogout}>Sign out</button>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  )
}

const st = {
  nav: { position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid #f0e6ff', boxShadow:'0 2px 16px rgba(139,92,246,0.08)' },
  inner: { maxWidth:1100, margin:'0 auto', padding:'0 1.25rem', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.75rem' },
  logo: { display:'flex', alignItems:'center', gap:'0.5rem', fontFamily:'"Georgia",serif', fontSize:'1.3rem', fontWeight:700, color:'#7c3aed', textDecoration:'none', flexShrink:0 },
  desktopLinks: { display:'flex', alignItems:'center', gap:'0.15rem', flex:1, justifyContent:'center' },
  link: { padding:'0.4rem 0.75rem', borderRadius:8, fontSize:'0.875rem', fontWeight:500, color:'#4b5563', textDecoration:'none', whiteSpace:'nowrap' },
  active: { background:'#f5f0ff', color:'#7c3aed', fontWeight:600 },
  authArea: { display:'flex', alignItems:'center', gap:'0.75rem', flexShrink:0 },
  userChip: { display:'flex', alignItems:'center', gap:'0.5rem' },
  avatar: { width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#ec4899)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.8rem', flexShrink:0 },
  userMeta: { display:'flex', flexDirection:'column' },
  userName: { fontSize:'0.82rem', fontWeight:600, color:'#1f2937', lineHeight:1.2 },
  userRole: { fontSize:'0.68rem', color:'#9ca3af', textTransform:'capitalize' },
  btnOut: { padding:'0.4rem 0.9rem', borderRadius:8, border:'1.5px solid #e9d5ff', background:'transparent', fontSize:'0.82rem', fontWeight:500, color:'#7c3aed', cursor:'pointer', whiteSpace:'nowrap' },
  hamburger: { background:'transparent', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#7c3aed', padding:'0.25rem 0.5rem', lineHeight:1, flexShrink:0 },
  mobileMenu: { display:'flex', flexDirection:'column', background:'#fff', borderTop:'1px solid #f0e6ff', padding:'1rem 1.25rem 1.5rem', boxShadow:'0 8px 24px rgba(139,92,246,0.1)' },
  mobileLink: { padding:'0.75rem 1rem', borderRadius:10, fontSize:'0.95rem', fontWeight:500, color:'#4b5563', textDecoration:'none', marginBottom:'0.25rem' },
  mobileLinkActive: { background:'#f5f0ff', color:'#7c3aed', fontWeight:600 },
  mobileDivider: { height:1, background:'#f0e6ff', margin:'0.75rem 0' },
  mobileUser: { display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.5rem 1rem', marginBottom:'0.75rem' },
  mobileLogout: { margin:'0 1rem', padding:'0.75rem', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:10, fontSize:'0.9rem', fontWeight:600, cursor:'pointer' },
}