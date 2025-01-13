import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabaseClient'
import { updateProduct } from '../services/productService'
import imageCompression from 'browser-image-compression'

export default function ProductModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    originalPrice: '',
    currentPrice: '',
    image: null,
    previewUrl: null,
    recommendation: '',
    purchaseLink: '',
    inquiryLink: ''
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || '',
        originalPrice: initialData.original_price || '',
        currentPrice: initialData.current_price || '',
        image: null,
        previewUrl: initialData.image_url || null,
        recommendation: initialData.recommendation || '',
        purchaseLink: initialData.purchase_link || '',
        inquiryLink: initialData.inquiry_link || ''
      })
    } else {
      // 重置表单数据
      setFormData({
        name: '',
        category: '',
        originalPrice: '',
        currentPrice: '',
        image: null,
        previewUrl: null,
        recommendation: '',
        purchaseLink: '',
        inquiryLink: ''
      })
    }
    setErrors({})
  }, [initialData, isOpen])

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true
    }
    
    try {
      const compressedFile = await imageCompression(file, options)
      return compressedFile
    } catch (error) {
      console.error('图片压缩失败:', error)
      throw new Error('图片压缩失败')
    }
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        // 检查文件大小
        if (file.size > MAX_FILE_SIZE) {
          toast.error('图片大小不能超过5MB')
          e.target.value = ''
          return
        }

        // 创建本地预览
        const reader = new FileReader()
        reader.onloadend = () => {
          const previewUrl = reader.result
          setFormData(prev => ({
            ...prev,
            image: file,
            previewUrl: previewUrl
          }))
        }
        reader.readAsDataURL(file)
        
        setErrors(prev => ({ ...prev, image: null }))
      } catch (error) {
        toast.error(error.message || '图片处理失败')
        e.target.value = ''
      }
    }
  }

  const validateField = (field, value) => {
    if (!value || (field === 'currentPrice' && isNaN(value))) {
      setErrors(prev => ({ ...prev, [field]: '此项为必填项' }))
    } else {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleBlur = (field) => (e) => {
    validateField(field, e.target.value || formData[field])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // 1. 数据验证
      const requiredFields = ['name', 'category', 'currentPrice', 'purchaseLink', 'inquiryLink']
      const isValid = requiredFields.every(field => {
        const value = formData[field]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          setErrors(prev => ({...prev, [field]: '该字段为必填项'}))
          return false
        }
        return true
      })

      if (!isValid) {
        toast.error('请填写所有必填项')
        return
      }

      // 2. 处理图片上传
      let imageUrl = formData.image
      if (formData.image && typeof formData.image !== 'string') {
        const file = formData.image
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `product-images/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('product-images')
          .upload(filePath, file)

        if (uploadError) throw new Error(`图片上传失败: ${uploadError.message}`)

        const { data: urlData } = supabase
          .storage
          .from('product-images')
          .getPublicUrl(filePath)

        imageUrl = urlData.publicUrl
      }

      // 3. 准备数据
      const productData = {
        name: String(formData.name).trim(),
        category: formData.category,
        original_price: formData.originalPrice ? Number(formData.originalPrice) : null,
        current_price: Number(formData.currentPrice),
        image_url: imageUrl || null,
        recommendation: formData.recommendation ? String(formData.recommendation).trim() : null,
        purchase_link: String(formData.purchaseLink).trim(),
        inquiry_link: String(formData.inquiryLink).trim(),
        updated_at: new Date().toISOString()
      }

      // 4. 数据库操作
      let result
      if (initialData?.id) {
        console.log('准备更新商品:', initialData.id)
        result = await updateProduct(initialData.id, productData)
        console.log('更新结果:', result)
      } else {
        // 新增商品
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()

        if (error) throw error
        if (!data || data.length === 0) throw new Error('新增商品失败')
        result = data[0]
      }

      // 5. 成功处理
      onSubmit(result)
      onClose()
    } catch (error) {
      console.error('操作失败:', error)
      const errorMessage = error.message || '操作失败，请重试'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
          style={{ fontSize: '24px', lineHeight: '1' }}
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-6">{initialData ? '编辑商品' : '新增商品'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4" style={{ maxHeight: 'calc(100vh - 10rem)', overflowY: 'auto' }}>
          {/* 商品名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              商品名称<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                setErrors(prev => ({ ...prev, name: null }))
              }}
              onBlur={handleBlur('name')}
              style={{
                height: '34px',
                backgroundColor: '#f5f5f5',
                boxShadow: 'inset 0 0 0 1px transparent'
              }}
              className={`mt-1 block w-full rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-black focus:shadow-[inset_0_0_0_1px_black] ${
                errors.name ? 'border-red-500' : ''
              }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* 商品分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              商品分类<span className="text-red-500">*</span>
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {['Recommended', 'SHOES', 'JACKETS', 'PANTS', 'PEARLS', 'T-shirt'].map(cat => (
                <div
                  key={cat}
                  className={`flex items-center p-2 rounded-md cursor-pointer ${
                    formData.category === cat
                      ? 'bg-black text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      category: cat
                    }))
                    setErrors(prev => ({ ...prev, category: null }))
                  }}
                >
                  <span className="text-sm">{cat}</span>
                </div>
              ))}
            </div>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            <p className="text-sm text-gray-500 mt-2">
              • 选择 Recommended 分类的商品会显示在顶部推荐区域
            </p>
          </div>

          {/* 价格 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">原价</label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                style={{
                  height: '34px',
                  backgroundColor: '#f5f5f5',
                  boxShadow: 'inset 0 0 0 1px transparent'
                }}
                className="mt-1 block w-full rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-black focus:shadow-[inset_0_0_0_1px_black]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                现价<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.currentPrice}
                onChange={(e) => {
                  setFormData({ ...formData, currentPrice: e.target.value })
                  setErrors(prev => ({ ...prev, currentPrice: null }))
                }}
                onBlur={handleBlur('currentPrice')}
                style={{
                  height: '34px',
                  backgroundColor: '#f5f5f5',
                  boxShadow: 'inset 0 0 0 1px transparent'
                }}
                className={`mt-1 block w-full rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-black focus:shadow-[inset_0_0_0_1px_black] ${
                  errors.currentPrice ? 'border-red-500' : ''
                }`}
              />
              {errors.currentPrice && <p className="text-red-500 text-sm mt-1">{errors.currentPrice}</p>}
            </div>
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              商品图片
            </label>
            <div className="mt-1 flex flex-col space-y-2">
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-black"
                >
                  选择图片
                </label>
                {(formData.previewUrl || initialData?.image_url) && (
                  <img
                    src={formData.previewUrl || initialData?.image_url}
                    alt="预览"
                    className="ml-4 w-20 h-20 object-cover rounded-md"
                  />
                )}
              </div>
              <div className="text-sm text-gray-500">
                <p>• 支持 jpg、png 格式</p>
                <p>• 图片大小不能超过 5MB</p>
                <p>• 建议尺寸：1024×1024px</p>
                <p>• 大图片将自动压缩以提高上传速度</p>
              </div>
            </div>
          </div>

          {/* 推荐信息 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">推荐信息</label>
            <textarea
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              style={{
                height: '72px',
                backgroundColor: '#f5f5f5',
                boxShadow: 'inset 0 0 0 1px transparent'
              }}
              className="mt-1 block w-full rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-black focus:shadow-[inset_0_0_0_1px_black]"
              rows="3"
            />
            <p className="text-sm text-gray-500 mt-2">
              • 只有商品分类为 Recommended 时，推荐信息才会展示
            </p>
          </div>

          {/* 链接 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                购买链接<span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.purchaseLink}
                onChange={(e) => {
                  setFormData({ ...formData, purchaseLink: e.target.value })
                  setErrors(prev => ({ ...prev, purchaseLink: null }))
                }}
                onBlur={handleBlur('purchaseLink')}
                style={{
                  height: '34px',
                  backgroundColor: '#f5f5f5',
                  boxShadow: 'inset 0 0 0 1px transparent'
                }}
                className={`mt-1 block w-full rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-black focus:shadow-[inset_0_0_0_1px_black] ${
                  errors.purchaseLink ? 'border-red-500' : ''
                }`}
              />
              {errors.purchaseLink && <p className="text-red-500 text-sm mt-1">{errors.purchaseLink}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                咨询链接<span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.inquiryLink}
                onChange={(e) => {
                  setFormData({ ...formData, inquiryLink: e.target.value })
                  setErrors(prev => ({ ...prev, inquiryLink: null }))
                }}
                onBlur={handleBlur('inquiryLink')}
                style={{
                  height: '34px',
                  backgroundColor: '#f5f5f5',
                  boxShadow: 'inset 0 0 0 1px transparent'
                }}
                className={`mt-1 block w-full rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-black focus:shadow-[inset_0_0_0_1px_black] ${
                  errors.inquiryLink ? 'border-red-500' : ''
                }`}
              />
              {errors.inquiryLink && <p className="text-red-500 text-sm mt-1">{errors.inquiryLink}</p>}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              style={{
                height: '40px',
                backgroundColor: '#000',
                color: '#fff'
              }}
              className="w-full rounded-md font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-1 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '保存中...' : (initialData ? '保存更改' : '保存')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
