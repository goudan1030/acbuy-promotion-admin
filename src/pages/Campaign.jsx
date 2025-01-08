import { useState, useEffect } from 'react'
import { supabase } from "../lib/supabaseClient"

import {  toast } from 'react-toastify'
import CampaignProductModal from "../components/CampaignProductModal"

export default function Campaign() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 获取投放商品
  const getCampaignProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('campaign_products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data)
    } catch (error) {
      console.error('获取投放商品失败:', error)
      toast.error('获取投放商品失败', {
        position: 'top-center',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }
   // 删除商品
   const handleDelete = async (productId) => {
    const confirmDelete = window.confirm('确定要删除该投放商品吗？')
    if (!confirmDelete) return

    try {
      setLoading(true)
      toast.loading('正在删除商品...', {
        position: 'top-center',
        duration: 1000
      })

      const { error } = await supabase
        .from('campaign_products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      toast.success('投放商品删除成功', {
        position: 'top-center',
        duration: 5000
      })
      getCampaignProducts() // 刷新投放商品列表
    } catch (error) {
      console.error('删除投放商品失败:', error)
      toast.error(`删除失败: ${error.message}`, {
        position: 'top-center',
        duration: 5000
      })
    } finally {
      setLoading(false)
      toast.dismiss()
    }
  }
  // 初始化数据
  useEffect(() => {
    getCampaignProducts()
  }, [])

  
  // 分页处理
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem)

  return (
    <div className="h-[calc(100vh-20rem)] flex flex-col">
      <div className="flex-1 p-6">
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* 标题和新增按钮 */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">投放管理</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="h-[34px] flex items-center bg-black text-white font-bold px-4 rounded hover:bg-gray-800"
              style={{ fontSize: '14px' }}
            >
              新增投放商品
            </button>
          </div>

          {/* 商品列表 */}
          <div className="bg-white rounded-lg shadow-sm">
            <table className="min-w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 w-1/2">商品名称</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">价格</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">状态</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody>
              {currentItems.map(product => (
  <tr key={product.id} className="border-b hover:bg-gray-50">
    <td className="px-6 py-4 text-sm text-gray-900">
      <div className="flex items-center">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-10 h-10 rounded-full object-cover mr-4"
          />
        )}
        <div>
          <div>{product.name}</div>
          <div className="text-xs text-gray-500">{product.description}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 text-sm text-gray-900">
      <div>¥{product.price}</div>
      {product.original_price && (
        <div className="text-xs text-gray-500 line-through">¥{product.original_price}</div>
      )}
    </td>
    <td className="px-6 py-4 text-sm text-gray-900">
      {product.is_recommended ? (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          推荐
        </span>
      ) : (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          普通
        </span>
      )}
    </td>
    <td className="px-6 py-4 text-sm text-gray-900">
      <button
        className="text-red-600 hover:text-red-900"
        onClick={() => handleDelete(product.id)}
      >
        移除
      </button>
    </td>
  </tr>
))}
              </tbody>
            </table>
          </div>


          {/* 分页控件 */}
          <div className="flex justify-center mt-6 pb-6">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              {Array.from({ length: Math.ceil(products.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === page
                      ? 'z-10 bg-black border-black text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* 新增商品模态框 */}
      {isModalOpen && (
        <CampaignProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(newProduct) => {
            setProducts(prev => [newProduct, ...prev])
            setIsModalOpen(false)
          }}
        />
      )}
    </div>
  )
}