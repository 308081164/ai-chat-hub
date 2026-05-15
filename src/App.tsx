import { Main } from './pages/Main'
import { useAppStore } from './store/useAppStore'

function App() {
  const { theme } = useAppStore()

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <Main />
    </div>
  )
}

export default App