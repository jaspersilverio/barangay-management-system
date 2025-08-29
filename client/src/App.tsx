import './App.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { AuthProvider } from './context/AuthContext'
import { PurokProvider } from './context/PurokContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PurokProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </PurokProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
