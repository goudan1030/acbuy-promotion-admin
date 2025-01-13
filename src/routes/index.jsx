import { createBrowserRouter } from 'react-router-dom'
import Login from '../components/Auth/Login'
import ProtectedRoute from './ProtectedRoute'
import AdminLayout from '../layouts/AdminLayout'
import Dashboard from '../pages/Dashboard' // 确保正确导入
import Campaign from '../pages/Campaign'
import Category from '../pages/Category'
import Admin from '../pages/Admin'
import TrackingCode from '../pages/TrackingCode'
import AppDownload from '../pages/AppDownload'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />
  },
  {
    path: '/admin',
    element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Dashboard /> }, // 默认显示仪表盘
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'campaign', element: <Campaign /> },
      { path: 'category', element: <Category /> },
      { path: 'admin', element: <Admin /> },
      { path: 'tracking-code', element: <TrackingCode /> },
      { path: 'app-download', element: <AppDownload /> }
    ]
  }
])

export default router