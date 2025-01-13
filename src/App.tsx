import React, { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { supabase } from './lib/supabaseClient'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Session } from '@supabase/supabase-js'

const App: React.FC = () => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setLoading(false)
      } catch (error) {
        console.error('Error checking session:', error)
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      console.log('Auth state changed:', event)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div>加载中...</div>
  }

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  )
}

export default App