import { Link, Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui', margin: 20 }}>
      <header style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Real-Time Polling</h1>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/">Polls</Link>
        </nav>
      </header>
      <main style={{ marginTop: 20 }}>
        <Outlet />
      </main>
    </div>
  )
}
