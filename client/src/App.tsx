import './App.css'
import './styles/consistency.css'
import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { AuthProvider } from './context/AuthContext'
import { PurokProvider } from './context/PurokContext'
import { DashboardProvider } from './context/DashboardContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PurokProvider>
          <DashboardProvider>
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
          </DashboardProvider>
        </PurokProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
