import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { setupStore } from './store'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import { useAppDispatch } from './hooks/useAppDispatch'
import { loadTheme } from './store/slices/themeSlice'

// Create a component to load theme
const AppContent = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(loadTheme())
  }, [dispatch])

  return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
  )
}

function App() {
  const store = setupStore()
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  )
}

export default App




