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
  'Healthcare','Shopping','Education','Salary','Freelance','Investment','Other'
]

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [filterType, setFilterType]     = useState('')
  const [filterCat, setFilterCat]       = useState('')
  const [form, setForm] = useState({
    title: '', amount: '', type: 'expense',
    category: 'Food', date: new Date().toISOString().split('T')[0], note: ''
  })
  const [loading, setLoading] = useState(false)

  const fetchTx = async () => {
    const params = new URLSearchParams()
    if (filterType) params.set('type', filterType)
    if (filterCat)  params.set('category', filterCat)
    const res = await fetch(`${API}/transactions?${params}`)
    setTransactions(await res.json())
  }

  useEffect(() => { fetchTx() }, [filterType, filterCat])

  const handleSubmit = async () => {
    if (!form.title || !form.amount) return
    setLoading(true)
    await fetch(`${API}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
    })
    setForm({ title:'', amount:'', type:'expense', category:'Food',
              date: new Date().toISOString().split('T')[0], note:'' })
    await fetchTx()
    setLoading(false)
  }

  const handleDelete = async (id) => {
    await fetch(`${API}/transactions/${id}`, { method: 'DELETE' })
    await fetchTx()
  }

  const inp = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#e2e8f0', fontWeight: 700 }}>Transactions</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>

        {/* Add form */}
        <div style={card}>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Add Transaction</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input placeholder="Title e.g. Grocery" value={form.title} onChange={inp('title')} />
            <input placeholder="Amount (₹)" type="number" value={form.amount} onChange={inp('amount')} />
            <select value={form.type} onChange={inp('type')}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <select value={form.category} onChange={inp('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={form.date} onChange={inp('date')} />
            <input placeholder="Note (optional)" value={form.note} onChange={inp('note')} />
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ background: '#38bdf8', color: '#0f172a' }}
            >
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </div>

        {/* List */}
        <div style={card}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ flex: 1 }}>
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ flex: 1 }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {transactions.length === 0
            ? <p style={{ color: '#475569', fontSize: '0.85rem' }}>No transactions found.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '520px', overflowY: 'auto' }}>
                {transactions.map(t => (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#0f172a', borderRadius: '8px', padding: '0.75rem 1rem',
                    border: '1px solid #334155'
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{t.title}</p>
                      <p style={{ fontSize: '0.78rem', color: '#64748b' }}>{t.category} · {t.date}</p>
                      {t.note && <p style={{ fontSize: '0.78rem', color: '#475569' }}>{t.note}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{
                        fontWeight: 700, fontSize: '1rem',
                        color: t.type === 'income' ? '#34d399' : '#f87171'
                      }}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => handleDelete(t.id)}
                        style={{ background: '#7f1d1d', color: '#fca5a5', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}