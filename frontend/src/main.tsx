import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import App from './App.js'
import store from './lib/store'
import { Provider } from 'react-redux'
import './index.css';


const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
