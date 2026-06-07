import { useState, useEffect } from 'react'

const API = '/api'

const card = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  padding: '1.5rem',
}

const CATEGORIES = [
  'Food','Transport','Housing','Entertainment',
  'Healthcare','Shopping','Education','Other'
]

export default function Budgets() {
  const [budgets, setBudgets]   = useState([])
  const [form, setForm]         = useState({ category: 'Food', limit: '', month: '' })
  const [month, setMonth]       = useState(new Date().toISOString().slice(0, 7))

  const fetchBudgets = async () => {
    const res = await fetch(`${API}/budgets?month=${month}`)
    setBudgets(await res.json())
  }

  useEffect(() => { fetchBudgets() }, [month])

  const handleSubmit = async () => {
    if (!form.limit) return
    await fetch(`${API}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, limit: parseFloat(form.limit), month })
    })
    setForm(f => ({ ...f, limit: '' }))
    fetchBudgets()
  }

  const handleDelete = async (id) => {
    await fetch(`${API}/budgets/${id}`, { method: 'DELETE' })
    fetchBudgets()
  }

  const inp = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#e2e8f0', fontWeight: 700 }}>Monthly Budgets</h2>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>

        {/* Set budget form */}
        <div style={card}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Set Budget</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <select value={form.category} onChange={inp('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              type="number"
              placeholder="Budget limit (₹)"
              value={form.limit}
              onChange={inp('limit')}
            />
            <p style={{ color: '#475569', fontSize: '0.78rem' }}>Month: {month}</p>
            <button
              onClick={handleSubmit}
              style={{ background: '#818cf8', color: '#fff' }}
            >
              Set Budget
            </button>
          </div>
        </div>

        {/* Budget progress list */}
        <div style={card}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Budget Usage — {month}
          </p>
          {budgets.length === 0
            ? <p style={{ color: '#475569', fontSize: '0.85rem' }}>No budgets set for this month.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {budgets.map(b => {
                  const pct = Math.min((b.spent / b.limit) * 100, 100)
                  const color = pct >= 100 ? '#f87171' : pct >= 75 ? '#fb923c' : '#34d399'
                  return (
                    <div key={b.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>{b.category}</span>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                            ₹{b.spent.toLocaleString('en-IN')} / ₹{b.limit.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => handleDelete(b.id)}
                            style={{ background: 'transparent', color: '#64748b', padding: '0.1rem 0.4rem', fontSize: '0.8rem', border: '1px solid #334155' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div style={{ background: '#0f172a', borderRadius: '999px', height: '8px' }}>
                        <div style={{
                          width: `${pct}%`,
                          background: color,
                          height: '8px',
                          borderRadius: '999px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                      {pct >= 100 && (
                        <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                          Over budget by ₹{(b.spent - b.limit).toLocaleString('en-IN')}!
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
          }
        </div>
      </div>
    </div>
  )
}