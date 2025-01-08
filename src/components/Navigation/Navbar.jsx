import { supabase } from '../../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="h-16 flex items-center justify-end px-6 bg-white">
      <button
        onClick={handleLogout}
        className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
      >
        退出登录
      </button>
    </div>
  )
}