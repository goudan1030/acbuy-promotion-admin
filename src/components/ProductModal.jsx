import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { uploadImage, deleteImage } from '../services/imageService'
import imageCompression from 'browser-image-compression'

// 添加 cleanUrl 函数定义（放在组件外部）
const cleanUrl = (url) => {
  if (!url) return ''
  return url.replace(/['"]/g, '')
}

export default function ProductModal({ isOpen, onClose, onSubmit, initialData, mode = 'default' }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    currentPrice: '',
    originalPrice: '',
    imageId: null,
    imageUrl: '',
    previewUrl: null,
    qcImageId: null,
    qcImageUrl: '',
    qcPreviewUrl: null,
    purchaseLink: ''
  })

  // 新增：临时文件状态
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedQCFile, setSelectedQCFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (initialData) {
      console.log('初始化数据:', initialData) // 调试日志
      setFormData({
        name: initialData.name || '',
        category: initialData.category || '',
        currentPrice: initialData.current_price || '',
        originalPrice: initialData.original_price || '',
        imageId: initialData.image_id || null,
        imageUrl: initialData.image_url || '', // 添加 image_url
        previewUrl: initialData.image?.public_url || null,
        qcImageId: initialData.qc_image_id || null,
        qcImageUrl: initialData.qc_image_url || '', // 添加 qc_image_url
        qcPreviewUrl: initialData.qc_image?.public_url || null,
        purchaseLink: initialData.purchase_link || ''
      })
      // 清除之前可能存在的临时文件
      setSelectedFile(null)
      setSelectedQCFile(null)
    }
  }, [initialData])

  // 修改图片选择处理函数
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      toast.error('图片大小不能超过5MB')
      return
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件')
      return
    }

    // 创建本地预览URL
    const previewUrl = URL.createObjectURL(file)
    
    // 保存文件和更新预览
    setSelectedFile(file)
    setFormData(prev => ({
      ...prev,
      previewUrl: previewUrl
    }))
  }

  // 添加 QC 图片选择处理函数
  const handleQCImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      toast.error('图片大小不能超过5MB')
      return
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件')
      return
    }

    // 创建本地预览URL
    const previewUrl = URL.createObjectURL(file)
    
    // 保存文件和更新预览
    setSelectedQCFile(file)
    setFormData(prev => ({
      ...prev,
      qcPreviewUrl: previewUrl
    }))
  }

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 表单验证
    const errors = {}
    if (!formData.name?.trim()) errors.name = '请输入商品名称'
    if (!formData.category?.trim()) errors.category = '请选择商品分类'
    if (!formData.currentPrice) errors.currentPrice = '请输入商品价格'
    if (!formData.purchaseLink?.trim()) errors.purchaseLink = '请输入购买链接'
    
    if (Object.keys(errors).length > 0) {
      setErrors(errors)
      return
    }

    setIsLoading(true)
    const toastId = toast.loading('正在保存...')

    try {
      let imageId = formData.imageId
      let qcImageId = formData.qcImageId
      let imageUrl = formData.imageUrl
      let qcImageUrl = formData.qcImageUrl

      // 处理商品图片
      if (selectedFile) {
        const compressedFile = await compressImage(selectedFile)
        const imageData = await uploadImage(compressedFile)
        imageId = imageData.id
        imageUrl = null // 如果上传了新图片，清除URL
      }

      // 处理QC图片
      if (selectedQCFile) {
        const compressedQCFile = await compressImage(selectedQCFile)
        const qcImageData = await uploadImage(compressedQCFile)
        qcImageId = qcImageData.id
        qcImageUrl = null // 如果上传了新图片，清除URL
      }

      const productData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        current_price: formData.currentPrice,
        image_id: imageId,
        image_url: cleanUrl(imageUrl),
        qc_image_id: qcImageId,
        qc_image_url: cleanUrl(qcImageUrl),
        purchase_link: formData.purchaseLink?.trim()
      }

      await onSubmit(productData)
      
      toast.success('保存成功')

      // 清理临时文件
      if (selectedFile && formData.previewUrl) {
        URL.revokeObjectURL(formData.previewUrl)
      }
      if (selectedQCFile && formData.qcPreviewUrl) {
        URL.revokeObjectURL(formData.qcPreviewUrl)
      }
      
      onClose()
    } catch (error) {
      console.error('保存失败:', error)
      toast.error(`保存失败: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 清理函数
  useEffect(() => {
    return () => {
      if (formData.previewUrl && !formData.imageId) {
        URL.revokeObjectURL(formData.previewUrl)
      }
      if (formData.qcPreviewUrl && !formData.qcImageId) {
        URL.revokeObjectURL(formData.qcPreviewUrl)
      }
    }
  }, [formData.previewUrl, formData.imageId, formData.qcPreviewUrl, formData.qcImageId])

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

  // 添加字段验证函数
  const validateField = (field, value) => {
    let error = null
    
    switch (field) {
      case 'name':
        if (!value?.trim()) error = '请输入商品名称'
        break
      case 'category':
        if (!value?.trim()) error = '请选择商品分类'
        break
      case 'currentPrice':
        if (!value || isNaN(value)) error = '请输入有效的价格'
        break
      case 'purchaseLink':
        if (!value?.trim()) error = '请输入购买链接'
        else if (!isValidUrl(value)) error = '请输入有效的URL'
        break
      case 'inquiryLink':
        if (!value?.trim()) error = '请输入咨询链接'
        else if (!isValidUrl(value)) error = '请输入有效的URL'
        break
      default:
        break
    }

    setErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }

  // 添加 URL 验证函数
  const isValidUrl = (url) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  // 添加失去焦点处理函数
  const handleBlur = (field) => () => {
    validateField(field, formData[field])
  }

  // 添加输入变化处理函数
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setErrors(prev => ({
      ...prev,
      [name]: null
    }))
  }

  // 判断是否为导流商品模式
  const isTrafficMode = mode === 'traffic'

  // 修改图片源获取函数
  const getImageSource = (data) => {
    if (!data) return null
    if (data.previewUrl) return data.previewUrl // 本地上传的预览
    if (data.imageUrl) return cleanUrl(data.imageUrl) // URL输入的图片
    if (data.image?.public_url) return cleanUrl(data.image.public_url) // 已上传的图片
    return null
  }

  const getQCImageSource = (data) => {
    if (!data) return null
    if (data.qcPreviewUrl) return data.qcPreviewUrl // 本地上传的预览
    if (data.qcImageUrl) return cleanUrl(data.qcImageUrl) // URL输入的图片
    if (data.qc_image?.public_url) return cleanUrl(data.qc_image.public_url) // 已上传的图片
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
          style={{ fontSize: '24px', lineHeight: '1' }}
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-6">{initialData ? '编辑商品' : '新增商品'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 商品名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              商品标题<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onBlur={handleBlur('name')}
              className={`mt-1 block w-full rounded-md px-3 h-[34px] bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black ${
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
              {[
                'Shoes',
                'Hoodies/Sweaters',
                'T-Shirts',
                'Jackets',
                'Pants/Shorts',
                'Headwear',
                'Accessories',
                'Other Stuff'
              ].map(cat => (
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
          </div>

          {/* 价格 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              商品价格<span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="currentPrice"
              value={formData.currentPrice}
              onChange={handleInputChange}
              onBlur={handleBlur('currentPrice')}
              className={`mt-1 block w-full rounded-md px-3 h-[34px] bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black ${
                errors.currentPrice ? 'border-red-500' : ''
              }`}
            />
            {errors.currentPrice && <p className="text-red-500 text-sm mt-1">{errors.currentPrice}</p>}
          </div>

          {/* 商品图片 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              商品图片<span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex flex-col space-y-2">
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="product-image-upload"
                />
                <label
                  htmlFor="product-image-upload"
                  className="cursor-pointer px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  选择图片
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    imageUrl: e.target.value,
                    // 清除文件上传的预览
                    previewUrl: null
                  }))}
                  placeholder="或输入图片URL"
                  className="ml-2 flex-1 px-3 h-[34px] bg-gray-50 rounded-md"
                />
              </div>
              {/* 图片预览 */}
              {(formData.previewUrl || formData.imageUrl || initialData?.image?.public_url || initialData?.image_url) && (
                <img
                  src={getImageSource(formData) || getImageSource(initialData)}
                  alt="预览"
                  className="mt-2 w-20 h-20 object-cover rounded-md"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = '/placeholder-image.jpg'
                  }}
                />
              )}
              <div className="text-sm text-gray-500">
                <p>• 支持图片上传或URL链接</p>
                <p>• 上传图片支持 jpg、png 格式</p>
                <p>• 图片大小不能超过 5MB</p>
                <p>• 建议尺寸：1024×1024px</p>
              </div>
            </div>
          </div>

          {/* QC图片 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              QC图片<span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex flex-col space-y-2">
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQCImageSelect}
                  className="hidden"
                  id="qc-image-upload"
                />
                <label
                  htmlFor="qc-image-upload"
                  className="cursor-pointer px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  选择图片
                </label>
                <input
                  type="url"
                  value={formData.qcImageUrl}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    qcImageUrl: e.target.value,
                    // 清除文件上传的预览
                    qcPreviewUrl: null
                  }))}
                  placeholder="或输入图片URL"
                  className="ml-2 flex-1 px-3 h-[34px] bg-gray-50 rounded-md"
                />
              </div>
              {/* QC图片预览 */}
              {(formData.qcPreviewUrl || formData.qcImageUrl || initialData?.qc_image?.public_url || initialData?.qc_image_url) && (
                <img
                  src={getQCImageSource(formData) || getQCImageSource(initialData)}
                  alt="QC预览"
                  className="mt-2 w-20 h-20 object-cover rounded-md"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = '/placeholder-image.jpg'
                  }}
                />
              )}
              <div className="text-sm text-gray-500">
                <p>• 支持图片上传或URL链接</p>
                <p>• 上传图片支持 jpg、png 格式</p>
                <p>• 图片大小不能超过 5MB</p>
                <p>• 建议尺寸：1024×1024px</p>
              </div>
            </div>
          </div>

          {/* 购买链接 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              购买链接<span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="purchaseLink"
              value={formData.purchaseLink}
              onChange={handleInputChange}
              onBlur={handleBlur('purchaseLink')}
              className={`mt-1 block w-full rounded-md px-3 h-[34px] bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black ${
                errors.purchaseLink ? 'border-red-500' : ''
              }`}
            />
            {errors.purchaseLink && <p className="text-red-500 text-sm mt-1">{errors.purchaseLink}</p>}
          </div>

          {/* 保存按钮 */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[40px] bg-black text-white rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '保存中...' : (initialData ? '保存更改' : '保存')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
