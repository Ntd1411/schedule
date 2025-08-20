import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/index.css'
import App from './pages/App'
import { SplashScreen } from '@capacitor/splash-screen'

SplashScreen.show({
  showDuration: 1000,
  autoHide: true
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
