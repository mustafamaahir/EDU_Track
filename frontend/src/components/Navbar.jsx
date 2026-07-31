import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location  = useLocation()
  const navigate  = useNavigate()
  const isAdmin   = user?.role === 'admin' || user?.role === 'superadmin'
  const isStudent = user?.role === 'student'

  const NAV_LINKS = [
    { label: 'Home',        path: '/' },
    // Student links
    ...(isStudent ? [
      { label: 'Results',     path: '/dashboard' },
      { label: 'Leaderboard', path: '/leaderboard' },
    ] : []),
    // Admin links
    ...(isAdmin ? [
      { label: 'Dashboard',   path: '/admin' },
      { label: 'Leaderboard', path: '/admin/leaderboard' },
    ] : []),
    { label: 'About',       path: '/about' },
    { label: 'Contact',     path: '/contact' },
    ...(!user ? [{ label: 'Login', path: '/login' }] : []),
  ]

  function handleLogout() { logout(); navigate('/') }

  return (
    <nav style={st.nav}>
      <div style={st.inner}>
        <Link to="/" style={st.logo}><span>🎓</span><span>EduTrack</span></Link>
        <div style={st.links}>
          {NAV_LINKS.map(l => (
            <Link key={l.path} to={l.path} style={{...st.link,...(location.pathname===l.path?st.active:{})}}>
              {l.label}
            </Link>
          ))}
        </div>
        {user && (
          <div style={st.authArea}>
            <div style={st.userChip}>
              <div style={st.avatar}>{user.name.split(' ').map(w=>w[0]).join('')}</div>
              <div>
                <div style={st.userName}>{user.name}</div>
                <div style={st.userRole}>{user.role}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={st.btnOut}>Sign out</button>
          </div>
        )}
      </div>
    </nav>
  )
}

const st = {
  nav:{ position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid #f0e6ff', boxShadow:'0 2px 16px rgba(139,92,246,0.08)' },
  inner:{ maxWidth:1100, margin:'0 auto', padding:'0 1.5rem', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' },
  logo:{ display:'flex', alignItems:'center', gap:'0.5rem', fontFamily:'"Georgia",serif', fontSize:'1.3rem', fontWeight:700, color:'#7c3aed', textDecoration:'none' },
  links:{ display:'flex', alignItems:'center', gap:'0.25rem' },
  link:{ padding:'0.4rem 0.85rem', borderRadius:8, fontSize:'0.9rem', fontWeight:500, color:'#4b5563', textDecoration:'none' },
  active:{ background:'#f5f0ff', color:'#7c3aed', fontWeight:600 },
  authArea:{ display:'flex', alignItems:'center', gap:'0.75rem' },
  userChip:{ display:'flex', alignItems:'center', gap:'0.5rem' },
  avatar:{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#ec4899)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.8rem' },
  userName:{ fontSize:'0.85rem', fontWeight:600, color:'#1f2937', lineHeight:1.2 },
  userRole:{ fontSize:'0.7rem', color:'#9ca3af', textTransform:'capitalize' },
  btnOut:{ padding:'0.4rem 1rem', borderRadius:8, border:'1.5px solid #e9d5ff', background:'transparent', fontSize:'0.82rem', fontWeight:500, color:'#7c3aed', cursor:'pointer' },
}
