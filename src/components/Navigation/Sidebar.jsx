import { Link, useLocation } from 'react-router-dom'
import {
  ChartBarIcon, // 仪表盘
  MegaphoneIcon, // 投放管理
  FolderIcon,   // 类目管理
  CogIcon       // 后台管理
} from '@heroicons/react/24/outline'

export default function Sidebar() {
  const location = useLocation() // 获取当前路由信息

  const menus = [
    { 
      name: '仪表盘', 
      path: '/admin/dashboard',
      icon: <ChartBarIcon className="w-5 h-5" />
    },
    { 
      name: '投放管理', 
      path: '/admin/campaign',
      icon: <MegaphoneIcon className="w-5 h-5" />
    },
    { 
      name: '类目管理', 
      path: '/admin/category',
      icon: <FolderIcon className="w-5 h-5" />
    },
    { 
      name: '后台管理', 
      path: '/admin/admin',
      icon: <CogIcon className="w-5 h-5" />
    }
  ]

  return (
    <aside className="w-64 bg-[#fafafa] shadow-sm p-6">
      <div className="mb-8">
        <img 
          src="/adminlogo.svg" 
          alt="Admin Logo"
          className="w-36 h-auto"
        />
      </div>
      
      <ul className="space-y-2">
        {menus.map(menu => {
          const isActive = location.pathname === menu.path
          return (
            <li key={menu.path}>
              <Link 
                to={menu.path}
                className={`flex items-center px-4 py-2 rounded-md transition-colors text-sm
                  ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm' // 选中状态
                      : 'text-gray-700 hover:bg-gray-100' // 未选中状态
                  }`}
              >
                {menu.icon}
                <span className="ml-3">{menu.name}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}