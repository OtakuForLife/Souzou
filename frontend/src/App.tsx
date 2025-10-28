import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { setupStore } from './store'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import { useTheme } from './hooks/useTheme'
import { ErrorBoundary } from './components/common'
import { log } from './lib/logger'
import { DialogProvider } from './contexts/DialogContext'
import FileUploadDialog from './components/FileUploadDialog'
import { Toaster } from 'sonner'

// Create a component to load theme
const AppContent = () => {
  const { refreshThemes, currentTheme } = useTheme()

  useEffect(() => {
    log.info('Application starting');
    // Load themes from database on app start
    refreshThemes();
  }, [refreshThemes])

  useEffect(() => {
    if (currentTheme) {
      log.info('Theme loaded', { theme: currentTheme.name, id: currentTheme.id });
    }
  }, [currentTheme])

  return (
    <DialogProvider>
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

        {/* Centralized Dialogs */}
        <FileUploadDialog />

        {/* Toast Notifications */}
        <Toaster position="bottom-right" richColors closeButton />
      </ErrorBoundary>
    </DialogProvider>
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




