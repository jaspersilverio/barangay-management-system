import './App.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
// import { AuthProvider } from './context/AuthContext'
import { PurokProvider } from './context/PurokContext'

function App() {
  return (
    // <AuthProvider>
      <PurokProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </PurokProvider>
    // </AuthProvider>
  )
}

export default App
