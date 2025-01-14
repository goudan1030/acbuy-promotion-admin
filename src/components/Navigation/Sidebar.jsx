import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  ChartBarIcon,
  MegaphoneIcon,
  FolderIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function Sidebar() {
  const location = useLocation()
  const [isAdminOpen, setIsAdminOpen] = useState(true)

  const adminSubMenus = [
    {
      name: '统计代码',
      path: '/admin/tracking-code',
      icon: <CodeBracketIcon className="w-5 h-5" />
    },
    {
      name: 'APP下载管理',
      path: '/admin/app-download',
      icon: <DevicePhoneMobileIcon className="w-5 h-5" />
    }
    // 可以继续添加其他二级菜单
  ]

  const mainMenus = [
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
      name: '导流商品', 
      path: '/admin/traffic',
      icon: <ArrowPathIcon className="w-5 h-5" />
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
        {mainMenus.map(menu => (
          <li key={menu.path}>
            <Link 
              to={menu.path}
              className={`flex items-center px-4 py-2 rounded-md transition-colors text-sm
                ${
                  location.pathname === menu.path
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              {menu.icon}
              <span className="ml-3">{menu.name}</span>
            </Link>
          </li>
        ))}

        {/* 后台管理（带二级菜单） */}
        <li>
          <div
            className="flex items-center justify-between px-4 py-2 rounded-md cursor-pointer text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsAdminOpen(!isAdminOpen)}
          >
            <div className="flex items-center">
              <CogIcon className="w-5 h-5" />
              <span className="ml-3">后台管理</span>
            </div>
            {isAdminOpen ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </div>
          
          {/* 二级菜单 */}
          {isAdminOpen && (
            <ul className="mt-2 ml-4 space-y-1">
              {adminSubMenus.map(submenu => (
                <li key={submenu.path}>
                  <Link
                    to={submenu.path}
                    className={`flex items-center px-4 py-2 rounded-md transition-colors text-sm
                      ${
                        location.pathname === submenu.path
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {submenu.icon}
                    <span className="ml-3">{submenu.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>
    </aside>
  )
}