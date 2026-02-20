import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

console.log('Main.tsx executing...');

try {
  const root = document.getElementById('root');
  if (!root) throw new Error('Root element not found');

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  console.log('React app mounted');
} catch (error) {
  console.error('Failed to mount app:', error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;"><h1>App Crash</h1><pre>${error}</pre></div>`;
}
