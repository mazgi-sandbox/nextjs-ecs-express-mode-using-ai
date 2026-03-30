'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Item {
  id: string
  name: string
}

const API_BASE = '/backend'

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [newName, setNewName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/items`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {})
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Failed to create item')
      const item = await res.json()
      setItems((prev) => [item, ...prev])
      setNewName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <main>
      <h1>Items</h1>
      <p><Link href="/">Home</Link></p>

      <form onSubmit={handleAdd}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Item name"
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !newName.trim()}>
          {submitting ? 'Adding...' : 'Add'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {items.length === 0 ? (
          <li>No items yet</li>
        ) : (
          items.map((item) => (
            <li key={item.id}>
              {item.name}{' '}
              <button onClick={() => handleDelete(item.id)}>Delete</button>
            </li>
          ))
        )}
      </ul>
    </main>
  )
}
