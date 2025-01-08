export default function Admin() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">后台管理</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">用户管理</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">权限管理</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">系统设置</h2>
          </div>
        </div>
      </div>
    )
  }