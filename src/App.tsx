import './App.css'

function App() {
  return (
    <main className="container flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="card card--featured text-center" style={{ maxWidth: '500px', padding: 'var(--space-12) var(--space-8)' }}>
        <h1>Harvest</h1>
        <p style={{ color: 'var(--color-dusty-taupe)', marginTop: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          A Frankenstein body-building roguelike
        </p>
        <button className="btn btn--primary btn--large">
          Begin Your Creation
        </button>
      </div>
    </main>
  )
}

export default App
