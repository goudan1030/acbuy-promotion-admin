import { useState, useEffect } from 'react'
import { getProducts, getProductsByCategory, deleteProduct, getCategories } from '../services/productService'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ProductModal from '../components/ProductModal'

export default function Category() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 计算当前页的数据
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = products.slice(indexOfFirstItem, indexOfLastItem)

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      setLoading(true)
      try {
        const [categoriesData, productsData] = await Promise.all([
          getCategories(),
          getProducts()
        ])
        
        setCategories(categoriesData)
        setProducts(productsData)
      } catch (error) {
        console.error('初始化数据失败:', error)
        toast.error('数据加载失败')
      } finally {
        setLoading(false)
      }
    }

    initData()
  }, [])

  // 分类切换处理
  const handleCategoryChange = async (category) => {
    setSelectedCategory(category)
    setCurrentPage(1) // 切换分类时重置到第一页
    setLoading(true)
    try {
      const data = category === 'all' 
        ? await getProducts()
        : await getProductsByCategory(category)
      setProducts(data)
    } catch (error) {
      console.error('获取商品失败:', error)
      toast.error('获取商品失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除商品
  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm('确定要删除该商品吗？')
    if (!confirmDelete) return

    try {
      setLoading(true)
      await deleteProduct(productId)
      toast.success('商品删除成功')
      handleCategoryChange(selectedCategory) // 刷新当前分类
    } catch (error) {
      console.error('删除商品失败:', error)
      toast.error(`删除失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 分页处理
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // 添加商品更新处理函数
  const handleProductUpdate = async (updatedProduct) => {
    try {
      setLoading(true)
      // 刷新商品列表
      const data = selectedCategory === 'all' 
        ? await getProducts()
        : await getProductsByCategory(selectedCategory)
      
      setProducts(data)
      toast.success('商品更新成功')
    } catch (error) {
      console.error('更新商品列表失败:', error)
      toast.error('更新商品列表失败')
    } finally {
      setLoading(false)
      setIsModalOpen(false)
      setEditingProduct(null)
    }
  }

  const handleEdit = (product) => {
    console.log('开始编辑商品:', product)
    setEditingProduct({
      id: product.id,  // 确保包含 id
      name: product.name || '',
      category: product.category || '',
      original_price: product.original_price || '',
      current_price: product.current_price || '',
      image_url: product.image_url || null,
      recommendation: product.recommendation || '',
      purchase_link: product.purchase_link || '',
      inquiry_link: product.inquiry_link || ''
    })
    setIsModalOpen(true)
  }

  return (
    <div className="h-[calc(100vh-20rem)] flex flex-col">
      <div className="flex-1 p-6">
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* 标题和新增按钮 */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">分类商品管理</h1>
            <button
              onClick={() => {
                setEditingProduct({
                  name: '',
                  category: '',
                  current_price: '',
                  image_url: ''
                })
                setIsModalOpen(true)
              }}
              className="h-[34px] flex items-center bg-black text-white font-bold px-4 rounded hover:bg-gray-800"
              style={{ fontSize: '14px' }} 
            >
              新增商品
            </button>
          </div>

          {/* 分类选择器 */}
          <div className="relative flex-1 mr-4">
            <div className="flex space-x-2 py-2">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`px-4 h-[34px] flex items-center rounded ${
                  selectedCategory === 'all' 
                    ? 'bg-black text-white'
                    : 'bg-transparent text-black'
                }`}
                style={{ fontSize: '14px' }}  // 添加字体大小
              >
                全部
                <span className="ml-2 text-sm opacity-80">
                  ({products.length})
                </span>
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 h-[34px] flex items-center rounded ${
                    selectedCategory === category 
                      ? 'bg-black text-white'
                      : 'bg-transparent text-black'
                  }`}
                  style={{ fontSize: '14px' }}  // 添加字体大小
                >
                  {category}
                  <span className="ml-2 text-sm opacity-80">
                    ({products.filter(p => p.category === category).length})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 商品列表 */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">图片</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">现价</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 h-16">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">¥{product.current_price}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-gray-500 hover:text-gray-700 focus:outline-none"
                              title="编辑"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-500 hover:text-red-700 focus:outline-none"
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
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {Array.from({ length: Math.ceil(products.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
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
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingProduct(null)
          }}
          onSubmit={handleProductUpdate}
          initialData={editingProduct}
        />
      )}

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  )
}