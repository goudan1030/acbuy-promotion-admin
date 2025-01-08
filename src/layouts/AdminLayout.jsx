import Sidebar from '../components/Navigation/Sidebar'
import Navbar from '../components/Navigation/Navbar'
import { Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-[936px] py-8"> {/* 新增容器 */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}