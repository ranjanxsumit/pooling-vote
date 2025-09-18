import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'

type Option = { id: string; text: string; votes?: number }
type Poll = { id: string; question: string; options: Option[] }

export default function PollDetail() {
  const { id } = useParams()
  const pollId = id as string
  const [poll, setPoll] = useState<Poll | null>(null)
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)

  // Socket client (memoized per poll)
  const socket: Socket | null = useMemo(() => {
    if (!pollId) return null
    const s = io() // proxied by Vite to backend
    return s
  }, [pollId])

  useEffect(() => {
    let active = true
    const load = async () => {
      const res = await fetch(`/api/polls/${pollId}`)
      if (!active) return
      if (res.ok) {
        const data = await res.json()
        // Flatten counts into votes number
        const options = data.options.map((o: any) => ({ id: o.id, text: o.text, votes: o._count?.votes ?? 0 }))
        setPoll({ id: data.id, question: data.question, options })
      }
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [pollId])

  useEffect(() => {
    if (!socket) return
    socket.emit('poll:join', pollId)
    socket.on('poll:results', (payload: { pollId: string; options: Option[] }) => {
      if (payload.pollId !== pollId) return
      setPoll((prev) => prev ? { ...prev, options: payload.options } : prev)
    })
    return () => {
      socket.emit('poll:leave', pollId)
      socket.disconnect()
    }
  }, [socket, pollId])

  const castVote = async (optionId: string) => {
    if (!userId) { alert('Enter a userId'); return }
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, pollOptionId: optionId })
    })
    if (!res.ok) {
      const m = await res.json().catch(() => ({}))
      alert(m.error || 'Failed to vote')
    }
  }

  if (loading) return <p>Loading…</p>
  if (!poll) return <p>Poll not found. <Link to="/">Go back</Link></p>

  return (
    <div>
      <p><Link to="/">← Back</Link></p>
      <h2>{poll.question}</h2>
      <div style={{ margin: '12px 0' }}>
        <input placeholder='Your userId' value={userId} onChange={e => setUserId(e.target.value)} />
      </div>
      <ul>
        {poll.options.map((o) => (
          <li key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => castVote(o.id)}>Vote</button>
            <span>{o.text}</span>
            <strong>· {o.votes ?? 0}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
