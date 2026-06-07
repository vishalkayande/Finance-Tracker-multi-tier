import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const API = '/api'

const card = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  padding: '1.5rem',
}

const COLORS = ['#38bdf8','#818cf8','#34d399','#fb923c','#f472b6','#a78bfa','#facc15']

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [recent, setRecent]   = useState([])

  useEffect(() => {
    fetch(`${API}/summary`).then(r => r.json()).then(setSummary)
    fetch(`${API}/transactions`).then(r => r.json()).then(d => setRecent(d.slice(0, 5)))
  }, [])

  if (!summary) return (
    <p style={{ color: '#64748b', textAlign: 'center', marginTop: '4rem' }}>
      Loading dashboard...
    </p>
  )

  const statsCards = [
    { label: 'Total Income',   value: summary.income,  color: '#34d399' },
    { label: 'Total Expenses', value: summary.expense, color: '#f87171' },
    { label: 'Net Savings',    value: summary.savings, color: summary.savings >= 0 ? '#38bdf8' : '#fb923c' },
  ]

  const pieData = Object.entries(summary.by_category || {}).map(([name, value]) => ({ name, value }))
  const barData = (summary.trend || []).map(t => ({ month: t.month, Expenses: t.total }))

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#e2e8f0', fontWeight: 700 }}>
        Dashboard Overview
      </h2>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {statsCards.map(s => (
          <div key={s.label} style={{ ...card, borderLeft: `4px solid ${s.color}` }}>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{s.label}</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>
              ₹{s.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>

        {/* Bar chart - monthly trend */}
        <div style={card}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Monthly Spending Trend</p>
          {barData.length === 0
            ? <p style={{ color: '#475569', fontSize: '0.85rem' }}>No data yet</p>
            : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="Expenses" fill="#38bdf8" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        {/* Pie chart - by category */}
        <div style={card}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Expenses by Category</p>
          {pieData.length === 0
            ? <p style={{ color: '#475569', fontSize: '0.85rem' }}>No expense data yet</p>
            : <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Recent transactions */}
      <div style={card}>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Recent Transactions</p>
        {recent.length === 0
          ? <p style={{ color: '#475569', fontSize: '0.85rem' }}>No transactions yet. Add some!</p>
          : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ color: '#64748b', textAlign: 'left' }}>
                  {['Title','Category','Date','Amount'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #334155' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{t.title}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#94a3b8' }}>{t.category}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#64748b' }}>{t.date}</td>
                    <td style={{
                      padding: '0.6rem 0.75rem',
                      fontWeight: 600,
                      color: t.type === 'income' ? '#34d399' : '#f87171'
                    }}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  )
}