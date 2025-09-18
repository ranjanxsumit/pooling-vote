import { useEffect, useState } from 'react'
import type React from 'react'
import { Link } from 'react-router-dom'
import { json } from '../utils/api.ts'

type Poll = { id: string; question: string; options: { id: string; text: string }[] }

export default function Polls() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string>('Option A, Option B')
  const [creatorId, setCreatorId] = useState('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    (async () => {
      try {
        const items = await json<Poll[]>('/api/polls')
        setPolls(items)
      } catch (e: any) {
        setError(e?.message || 'Failed to load polls')
      }
    })()
  }, [])

  const createPoll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const body = {
      question,
      isPublished: true,
      creatorId,
      options: options.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    try {
      const p = await json<Poll>('/api/polls', { method: 'POST', body: JSON.stringify(body) })
      setPolls((prev: Poll[]) => [p, ...prev])
      setQuestion(''); setOptions('Option A, Option B'); setError('')
    } catch (e: any) {
      setError(e?.message || 'Failed to create poll')
    }
  }

  return (
    <div>
      <h2>Polls</h2>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <form onSubmit={createPoll} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <input placeholder='Question' value={question} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)} required />
        <input placeholder='Creator ID' value={creatorId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreatorId(e.target.value)} required />
        <input placeholder='Options (comma-separated)' value={options} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOptions(e.target.value)} />
        <button type='submit'>Create Poll</button>
      </form>
      <p style={{ fontSize: 13, color: '#555' }}>
        Tip: If you don’t have a user yet, create one via POST /api/users and paste its id here. I can also auto-create a demo user for you.
        <button onClick={async () => {
          try {
            const u = await json<{ id: string; name: string; email: string }>(
              '/api/users',
              { method: 'POST', body: JSON.stringify({ name: 'Demo', email: `demo+${Date.now()}@example.com`, password: 'demopass' }) }
            )
            setCreatorId(u.id)
            setError('')
          } catch (e: any) {
            setError(e?.message || 'Failed to create demo user')
          }
        }} style={{ marginLeft: 8 }}>Create demo user</button>
      </p>

      <ul>
        {polls.map(p => (
          <li key={p.id}>
            <Link to={`/polls/${p.id}`}>{p.question}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
