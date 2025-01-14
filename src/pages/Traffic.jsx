import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'react-toastify'
import ProductModal from '../components/ProductModal'

export default function Traffic() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [editingProduct, setEditingProduct] = useState(null)

  // 获取导流商品
  const getTrafficProducts = async () => {
    setLoading(true)
    console.log('开始获取导流商品列表')
    
    try {
      const { data, error } = await supabase
        .from('traffic_products')
        .select(`
          *,
          image:image_id (
            id,
            public_url
          ),
          qc_image:qc_image_id (
            id,
            public_url
          ),
          image_url,
          qc_image_url
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取导流商品列表错误:', error)
        throw error
      }

      console.log('获取到的导流商品列表:', data)
      setProducts(data)
    } catch (error) {
      console.error('获取导流商品失败:', error)
      toast.error('获取导流商品失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化数据
  useEffect(() => {
    getTrafficProducts()
  }, [])

  // 分页处理
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem)

  // 删除商品
  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm('确定要删除该导流商品吗？')
    if (!confirmDelete) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('traffic_products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      toast.success('导流商品删除成功')
      getTrafficProducts()
    } catch (error) {
      console.error('删除导流商品失败:', error)
      toast.error(`删除失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 编辑商品
  const handleEdit = (product) => {
    console.log('编辑商品数据:', product) // 调试日志
    setEditingProduct({
      id: product.id,
      name: product.name || '',
      category: product.category || '',
      current_price: product.current_price || '',
      original_price: product.original_price || '',
      image_id: product.image_id || null,
      image: product.image || null,
      image_url: product.image_url || '', // 添加 image_url
      qc_image_id: product.qc_image_id || null,
      qc_image: product.qc_image || null,
      qc_image_url: product.qc_image_url || '', // 添加 qc_image_url
      purchase_link: product.purchase_link || ''
    })
    setIsModalOpen(true)
  }

  // 更新商品
  const handleProductUpdate = async (updatedProduct) => {
    const toastId = toast.loading('正在保存...', {
      position: 'top-center'
    })

    try {
      setLoading(true)

      if (editingProduct?.id) {
        const { error } = await supabase
          .from('traffic_products')
          .update({
            name: updatedProduct.name,
            category: updatedProduct.category,
            current_price: updatedProduct.current_price,
            original_price: updatedProduct.original_price,
            image_id: updatedProduct.image_id,
            qc_image_id: updatedProduct.qc_image_id,
            purchase_link: updatedProduct.purchase_link,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('traffic_products')
          .insert([{
            ...updatedProduct,
            created_at: new Date().toISOString()
          }])

        if (error) throw error
      }

      await getTrafficProducts()
      
      // 先显示成功提示，然后销毁 toast
      toast.update(toastId, {
        render: editingProduct ? '更新成功' : '添加成功',
        type: 'success',
        isLoading: false,
        autoClose: 1000,  // 1秒后自动关闭
        onClose: () => toast.dismiss(toastId)  // 关闭后销毁
      })

      setIsModalOpen(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('保存失败:', error)
      // 显示错误提示，然后销毁 toast
      toast.update(toastId, {
        render: `保存失败: ${error.message}`,
        type: 'error',
        isLoading: false,
        autoClose: 2000,  // 2秒后自动关闭
        onClose: () => toast.dismiss(toastId)  // 关闭后销毁
      })
    } finally {
      setLoading(false)
    }
  }

  // 添加 URL 清理函数
  const cleanUrl = (url) => {
    if (!url) return ''
    return url.replace(/['"]/g, '')
  }

  return (
    <div className="h-[calc(100vh-20rem)] flex flex-col">
      <div className="flex-1 p-6">
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* 标题和新增按钮 */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">导流商品管理</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="h-[34px] flex items-center bg-black text-white font-bold px-4 rounded hover:bg-gray-800"
              style={{ fontSize: '14px' }}
            >
              新增导流商品
            </button>
          </div>

          {/* 商品列表 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map(product => (
                  <tr key={product.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {(product.image?.public_url || product.image_url) && (
                          <img
                            src={cleanUrl(product.image?.public_url) || cleanUrl(product.image_url)}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md mr-3"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = '/placeholder-image.jpg'
                            }}
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">¥{product.current_price}</div>
                        {product.original_price && (
                          <div className="text-gray-500 line-through">¥{product.original_price}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
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
          <div className="flex justify-center mt-6">
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

      {/* 商品编辑模态框 */}
      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingProduct(null)
          }}
          onSubmit={handleProductUpdate}
          initialData={editingProduct}
          mode="traffic"
        />
      )}
    </div>
  )
} 