import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'

const nav = { display:'flex', gap:'0.5rem' }

const linkStyle = ({ isActive }) => ({
  padding: '0.5rem 1.1rem',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.9rem',
  textDecoration: 'none',
  color: isActive ? '#0f172a' : '#94a3b8',
  background: isActive ? '#38bdf8' : 'transparent',
  transition: 'all 0.2s',
})

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.4rem' }}>💰</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#38bdf8' }}>
            FinanceTracker
          </span>
        </div>
        <nav style={nav}>
          <NavLink to="/" end style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/transactions" style={linkStyle}>Transactions</NavLink>
          <NavLink to="/budgets" style={linkStyle}>Budgets</NavLink>
        </nav>
      </header>

      <main style={{ flex: 1, padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
        </Routes>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '1rem',
        color: '#475569',
        fontSize: '0.8rem',
        borderTop: '1px solid #1e293b'
      }}>
        Personal Finance Tracker · Dockerized Full-Stack App
      </footer>
    </div>
  )
}