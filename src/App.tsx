import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { Toaster } from 'react-hot-toast'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查用户是否已经登录
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoading(false)
    })

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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