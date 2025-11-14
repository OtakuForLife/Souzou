import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { setupStore } from './store'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import { useTheme } from './hooks/useTheme'
import { useSyncListener } from '@/hooks/useSyncListener'
import { useAutosave } from '@/hooks/useAutosave'
import { ErrorBoundary } from './components/common'
import { log } from './lib/logger'
import { DialogProvider } from './contexts/DialogContext'
import FileUploadDialog from './components/FileUploadDialog'
import { Toaster } from 'sonner'
import { isCapacitor } from './lib/platform'

// Create a component to load theme
const AppContent = () => {
  const { refreshThemes, currentTheme } = useTheme()

  // Listen to sync events and refresh Redux state
  useSyncListener();

  // Enable autosave for dirty entities
  useAutosave();

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

  // Update edge-to-edge background color when theme changes (Android only)
  useEffect(() => {
    if (!isCapacitor()) return;

    const updateEdgeToEdgeColor = async () => {
      try {
        // Dynamically import the plugin (only available on Capacitor/Android)
        const { EdgeToEdge } = await import('@capawesome/capacitor-android-edge-to-edge-support');

        // Get the computed background color from the root element
        const rootElement = document.documentElement;
        const computedStyle = getComputedStyle(rootElement);
        const backgroundColor = computedStyle.getPropertyValue('--color-main-content-background').trim() || '#1a1a1a';

        log.info('Updating edge-to-edge background color', { backgroundColor });
        await EdgeToEdge.setBackgroundColor({ color: backgroundColor });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        log.error('Failed to update edge-to-edge background color', err);
      }
    };

    updateEdgeToEdgeColor();
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




