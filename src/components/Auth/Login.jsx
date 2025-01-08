import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8f9fa]">
      <div className="bg-white p-10 rounded-lg shadow-sm w-full max-w-[400px] border border-[#e9ecef]">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-[#212529] mb-3">登录</h2>
          <p className="text-sm text-[#6c757d]">使用您的邮箱和密码登录</p>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#495057] mb-2">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md border border-[#ced4da] focus:border-[#80bdff] focus:ring-2 focus:ring-[#80bdff]/50 transition-all outline-none placeholder:text-[#6c757d]"
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#495057] mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md border border-[#ced4da] focus:border-[#80bdff] focus:ring-2 focus:ring-[#80bdff]/50 transition-all outline-none placeholder:text-[#6c757d]"
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0d6efd] text-white py-2.5 px-4 rounded-md hover:bg-[#0b5ed7] focus:ring-4 focus:ring-[#9ec5fe] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>登录中...</span>
              </div>
            ) : (
              '登录'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#6c757d]">
          还没有账号？{' '}
          <a href="#" className="text-[#0d6efd] hover:text-[#0b5ed7] hover:underline">
            立即注册
          </a>
        </div>
      </div>
    </div>
  )
}

export default Login