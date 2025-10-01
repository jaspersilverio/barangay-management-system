import './App.css'
import './styles/consistency.css'
import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { AuthProvider } from './context/AuthContext'
import { PurokProvider } from './context/PurokContext'
import { DashboardProvider } from './context/DashboardContext'

function App() {
  return (
    <AuthProvider>
      <PurokProvider>
        <DashboardProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </DashboardProvider>
      </PurokProvider>
    </AuthProvider>
  )
}

export default App
