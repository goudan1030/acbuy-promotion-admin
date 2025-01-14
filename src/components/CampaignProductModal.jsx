import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabaseClient'  // 修正后的路径
import 'react-toastify/dist/ReactToastify.css'
import imageCompression from 'browser-image-compression'  // 添加导入
import { uploadImage, deleteImage } from '../services/imageService'


export default function CampaignProductModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    imageId: null,
    previewUrl: null,
    purchaseLink: '',
    inquiryLink: '',
    is_recommended: false
  })

  // 新增：临时文件状态
  const [selectedFile, setSelectedFile] = useState(null)
  
  // 修复：统一处理输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  // 修复：更新表单验证逻辑
  const validateForm = (data) => {
    const errors = {}

    if (!data.name.trim()) {
      errors.name = '商品名称不能为空'
    }

    if (!data.description.trim()) {
      errors.description = '商品描述不能为空'
    }

    if (!data.price) {
      errors.price = '商品价格不能为空'
    }

    // 修复：更新链接验证逻辑
    if (!data.purchase_link.trim()) {
      errors.purchase_link = '购买链接不能为空'
    } else if (!isValidUrl(data.purchase_link)) {
      errors.purchase_link = '请输入有效的购买链接'
    }

    if (!data.inquiry_link.trim()) {
      errors.inquiry_link = '咨询链接不能为空'
    } else if (!isValidUrl(data.inquiry_link)) {
      errors.inquiry_link = '请输入有效的咨询链接'
    }

    return errors
  }


  // 新增：URL 验证函数
  const isValidUrl = (url) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }
  


  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price || '',
        originalPrice: initialData.original_price || '',
        imageId: initialData.image_id || null,
        previewUrl: initialData.image?.public_url || null,
        purchaseLink: initialData.purchase_link || '',
        inquiryLink: initialData.inquiry_link || '',
        is_recommended: initialData.is_recommended || false
      })
      // 清除之前可能存在的临时文件
      setSelectedFile(null)
    }
  }, [initialData])

  // 添加图片压缩函数
  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      fileType: file.type
    }
    
    try {
      const compressedFile = await imageCompression(file, options)
      return compressedFile
    } catch (error) {
      console.error('图片压缩失败:', error)
      throw new Error('图片压缩失败，请重试')
    }
  }

  // 添加文件大小限制常量
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

  // 添加本地预览图片状态
  const [previewImage, setPreviewImage] = useState(null)

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

  const validateField = (field, value) => {
    if (!value || (field === 'price' && isNaN(value))) {
      setErrors(prev => ({ ...prev, [field]: '此项为必填项' }))
    } else {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleBlur = (field) => () => {
    const value = formData[field]
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      setErrors(prev => ({...prev, [field]: '该字段为必填项'}))
    } else {
      setErrors(prev => ({...prev, [field]: null}))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 表单验证
    const errors = {}
    if (!formData.name?.trim()) errors.name = '请输入商品名称'
    if (!formData.price) errors.price = '请输入商品现价'
    
    if (Object.keys(errors).length > 0) {
      setErrors(errors)
      return
    }

    setIsLoading(true)
    const toastId = toast.loading('正在保存...', {
      position: 'top-center'
    })

    try {
      let imageId = formData.imageId
      console.log('开始处理表单提交，当前图片ID:', imageId) // 调试信息
      console.log('是否有新选择的图片:', !!selectedFile) // 调试信息

      // 如果有新选择的图片，先上传图片
      if (selectedFile) {
        try {
          console.log('开始处理新图片上传') // 调试信息
          
          // 压缩图片
          const compressedFile = await compressImage(selectedFile)
          console.log('图片压缩完成，开始上传') // 调试信息
          
          // 上传图片并获取图片记录
          const imageData = await uploadImage(compressedFile)
          console.log('新图片上传成功:', imageData) // 调试信息
          
          imageId = imageData.id

          // 如果有旧图片，删除它
          if (formData.imageId) {
            console.log('准备删除旧图片:', formData.imageId) // 调试信息
            await deleteImage(formData.imageId).catch(error => {
              console.error('删除旧图片失败:', error)
              // 继续执行，不中断保存流程
            })
          }
        } catch (error) {
          console.error('图片处理详细错误:', error) // 调试信息
          toast.update(toastId, {
            render: `图片处理失败: ${error.message}`,
            type: 'error',
            isLoading: false,
            autoClose: 3000
          })
          setIsLoading(false)
          return
        }
      }

      const productData = {
        name: formData.name.trim(),
        price: formData.price,
        original_price: formData.originalPrice || null,
        image_id: imageId,
        purchase_link: formData.purchaseLink?.trim() || null,
        inquiry_link: formData.inquiryLink?.trim() || null,
        is_recommended: formData.is_recommended || false
      }

      console.log('准备提交的商品数据:', productData) // 调试信息

      await onSubmit(productData)
      
      toast.update(toastId, {
        render: '保存成功',
        type: 'success',
        isLoading: false,
        autoClose: 2000
      })

      // 清理临时文件
      if (selectedFile && formData.previewUrl) {
        URL.revokeObjectURL(formData.previewUrl)
      }
      
      onClose()
    } catch (error) {
      console.error('保存失败详细错误:', error) // 调试信息
      toast.update(toastId, {
        render: `保存失败: ${error.message}`,
        type: 'error',
        isLoading: false,
        autoClose: 3000
      })
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

  // 清理函数
  useEffect(() => {
    return () => {
      // 组件卸载时清理临时预览URL
      if (formData.previewUrl && !formData.imageId) {
        URL.revokeObjectURL(formData.previewUrl)
      }
    }
  }, [formData.previewUrl, formData.imageId])

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

        <h2 className="text-xl font-bold mb-6">{initialData ? '编辑商品' : '新增投放商品'}</h2>
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
          {/* 商品推荐 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">商品推荐</label>
            <div 
              onClick={() => setFormData(prev => ({...prev, is_recommended: !prev.is_recommended}))}
              className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                formData.is_recommended ? 'bg-black' : 'bg-gray-300'
              }`}
            >
              <div 
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  formData.is_recommended ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
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
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value })
                  setErrors(prev => ({ ...prev, price: null }))
                }}
                onBlur={handleBlur('price')}
                style={{
                  height: '34px',
                  backgroundColor: '#f5f5f5',
                  boxShadow: 'inset 0 0 0 1px transparent'
                }}
                className={`mt-1 block w-full rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-black focus:shadow-[inset_0_0_0_1px_black] ${
                  errors.price ? 'border-red-500' : ''
                }`}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
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
                  onChange={handleImageSelect}
                  className="hidden"
                  id="campaign-image-upload"
                />
                <label
                  htmlFor="campaign-image-upload"
                  className="cursor-pointer px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-black"
                >
                  选择图片
                </label>
                {(formData.previewUrl || (initialData?.image?.public_url && !selectedFile)) && (
                  <img
                    src={formData.previewUrl || initialData?.image?.public_url}
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


          {/* 链接 */}
          <div className="grid grid-cols-2 gap-4">
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
                name="inquiryLink"
                value={formData.inquiryLink}
                onChange={handleInputChange}
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