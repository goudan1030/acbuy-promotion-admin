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
  const [editingProduct, setEditingProduct] = useState(null)

  // 获取投放商品
  const getCampaignProducts = async () => {
    setLoading(true)
    console.log('开始获取商品列表') // 调试信息
    
    try {
      const { data, error } = await supabase
        .from('campaign_products')
        .select(`
          *,
          image:image_id (
            id,
            public_url
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取商品列表错误:', error) // 调试信息
        throw error
      }

      console.log('获取到的商品列表:', data) // 调试信息
      setProducts(data)
    } catch (error) {
      console.error('获取投放商品失败:', error)
      toast.error('获取投放商品失败')
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

  // 添加商品更新处理函数
  const handleProductUpdate = async (updatedProduct) => {
    try {
      setLoading(true)
      console.log('开始更新商品，更新数据:', updatedProduct) // 调试信息

      const toastId = toast.loading('正在更新商品...', {
        position: 'top-center'
      })

      if (editingProduct?.id) {
        console.log('更新现有商品，ID:', editingProduct.id) // 调试信息
        
        // 更新现有商品
        const { data, error } = await supabase
          .from('campaign_products')
          .update({
            name: updatedProduct.name,
            price: updatedProduct.price,
            original_price: updatedProduct.original_price,
            image_id: updatedProduct.image_id, // 使用 image_id 而不是 image_url
            purchase_link: updatedProduct.purchase_link,
            inquiry_link: updatedProduct.inquiry_link,
            is_recommended: updatedProduct.is_recommended,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id)
          .select(`
            *,
            image:image_id (
              id,
              public_url
            )
          `)
          .single()

        if (error) {
          console.error('数据库更新错误:', error) // 调试信息
          throw error
        }
        
        console.log('更新成功，返回数据:', data) // 调试信息
      } else {
        // 新增商品
        const { error } = await supabase
          .from('campaign_products')
          .insert([{
            ...updatedProduct,
            created_at: new Date().toISOString()
          }])

        if (error) throw error
      }

      // 刷新商品列表
      await getCampaignProducts()
      
      toast.update(toastId, {
        render: `商品${editingProduct ? '更新' : '添加'}成功`,
        type: 'success',
        isLoading: false,
        autoClose: 2000
      })
      
      // 关闭模态框
      setIsModalOpen(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('商品操作失败:', error)
      toast.error(`操作失败: ${error.message}`, {
        position: 'top-center',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  // 修改编辑处理函数
  const handleEdit = (product) => {
    setEditingProduct({
      id: product.id,
      name: product.name || '',
      price: product.price || '',
      original_price: product.original_price || '',
      image_id: product.image_id || null,
      image: product.image || null,
      purchase_link: product.purchase_link || '',
      inquiry_link: product.inquiry_link || '',
      is_recommended: product.is_recommended || false
    })
    setIsModalOpen(true)
  }

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
                  <tr key={product.id} className="border-b">
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center">
                        {product.image && (
                          <img
                            src={product.image.public_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md mr-3"
                          />
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.is_recommended && (
                            <span className="text-xs bg-black text-white px-2 py-1 rounded mt-1 inline-block">
                              推荐
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="text-gray-900">¥{product.price}</div>
                        {product.original_price && (
                          <div className="text-gray-500 line-through text-xs">
                            ¥{product.original_price}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status === 'active' ? '已上架' : '已下架'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-gray-600 hover:text-gray-900"
                          title="编辑"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                          title="删除"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
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
          onClose={() => {
            setIsModalOpen(false)
            setEditingProduct(null)
          }}
          onSubmit={handleProductUpdate}
          initialData={editingProduct}
        />
      )}
    </div>
  )
}