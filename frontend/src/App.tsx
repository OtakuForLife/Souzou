import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { setupStore } from './store'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import { useAppDispatch } from './hooks/useAppDispatch'
import { loadTheme } from './store/slices/themeSlice'
import { ErrorBoundary } from './components/common'
import { log } from './lib/logger'

// Create a component to load theme
const AppContent = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    log.info('Application starting');
    dispatch(loadTheme());
  }, [dispatch])

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        log.error('Application error caught by boundary', error, {
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
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




