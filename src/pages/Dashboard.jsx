export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">仪表盘</h1>
      
      {/* 数据概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">今日访问量</h2>
          <p className="text-3xl font-bold text-blue-600">1,234</p>
          <p className="text-sm text-gray-500 mt-2">较昨日 +12%</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">新增用户</h2>
          <p className="text-3xl font-bold text-green-600">56</p>
          <p className="text-sm text-gray-500 mt-2">较上周 +8%</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">订单数量</h2>
          <p className="text-3xl font-bold text-purple-600">78</p>
          <p className="text-sm text-gray-500 mt-2">转化率 15%</p>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">访问趋势</h2>
          <div className="h-64 bg-gray-50 rounded-md flex items-center justify-center">
            <span className="text-gray-400">图表组件待接入</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">用户分布</h2>
          <div className="h-64 bg-gray-50 rounded-md flex items-center justify-center">
            <span className="text-gray-400">地图组件待接入</span>
          </div>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
        <h2 className="text-xl font-semibold mb-4">最近活动</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-md">
            <div>
              <p className="font-medium">新用户注册</p>
              <p className="text-sm text-gray-500">用户 "张三" 刚刚注册</p>
            </div>
            <span className="text-sm text-gray-500">2分钟前</span>
          </div>
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-md">
            <div>
              <p className="font-medium">新订单创建</p>
              <p className="text-sm text-gray-500">订单 #12345 已创建</p>
            </div>
            <span className="text-sm text-gray-500">15分钟前</span>
          </div>
        </div>
      </div>
    </div>
  )
}