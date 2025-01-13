import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabaseClient'  // 修正后的路径
import 'react-toastify/dist/ReactToastify.css'
import imageCompression from 'browser-image-compression'  // 添加导入


export default function CampaignProductModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: null,
    previewUrl: null,
    purchaseLink: initialData?.purchaseLink || '',  // 修改字段名
    inquiryLink: initialData?.inquiryLink || '',    // 修改字段名
    is_recommended: false
  })

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
        originalPrice: initialData.original_price || '',
        price: initialData.price || '',
        image: null,
        previewUrl: initialData.image_url || null,
        purchaseLink: initialData.purchase_link || '',
        inquiryLink: initialData.inquiry_link || '',
        is_recommended: initialData.is_recommended || false
      })
      setPreviewImage(initialData.image_url)
    } else {
      setFormData({
        name: '',
        originalPrice: '',
        price: '',
        image: null,
        previewUrl: null,
        purchaseLink: '',
        inquiryLink: '',
        is_recommended: false
      })
      setPreviewImage(null)
    }
    setErrors({})
  }, [initialData, isOpen])

  // 添加图片压缩函数
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

  // 添加文件大小限制常量
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

  // 添加本地预览图片状态
  const [previewImage, setPreviewImage] = useState(null)

  // 修改图片上传处理函数
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
          setPreviewImage(previewUrl)
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
    setIsLoading(true)

    try {
      // 验证必填字段...

      // 处理图片上传
      let imageUrl = formData.image
      if (formData.image && formData.image instanceof File) {
        try {
          // 压缩图片
          const compressedFile = await compressImage(formData.image)
          
          // 上传到 Supabase Storage
          const fileExt = formData.image.name.split('.').pop()
          const fileName = `${Date.now()}.${fileExt}`
          const filePath = `campaign-images/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('campaign-images')
            .upload(filePath, compressedFile)

          if (uploadError) throw uploadError

          // 获取公共URL
          const { data: { publicUrl } } = supabase.storage
            .from('campaign-images')
            .getPublicUrl(filePath)

          imageUrl = publicUrl
        } catch (error) {
          throw new Error(`图片上传失败: ${error.message}`)
        }
      }

      // 准备提交数据
      const productData = {
        name: String(formData.name).trim(),
        price: parseFloat(formData.price),
        original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        image_url: imageUrl,
        purchase_link: String(formData.purchaseLink).trim(),
        inquiry_link: String(formData.inquiryLink).trim(),
        is_recommended: formData.is_recommended,
        created_at: new Date().toISOString()
      }

      // 提交数据
      onSubmit(productData)
    } catch (error) {
      console.error('保存失败:', error)
      toast.error(error.message || '操作失败，请重试')
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
                  onChange={handleImageUpload}
                  className="hidden"
                  id="campaign-image-upload"
                />
                <label
                  htmlFor="campaign-image-upload"
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


          {/* 链接 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                购买链接<span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="purchaseLink"  // 修改字段名
                value={formData.purchase_link}
                onChange={handleInputChange}
                onBlur={handleBlur('purchaseLink')}
                style={{
                  height: '34px',
                  backgroundColor: '#f5f5f5',
                  boxShadow: 'inset 0 0 0 1px transparent'
                }}
                className={`mt-1 block w-full rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-black focus:shadow-[inset_0_0_0_1px_black] ${
                  errors.purchase_link ? 'border-red-500' : ''
                }`}
              />
              {errors.purchase_link && (
                <p className="text-red-500 text-sm mt-1">{errors.purchase_link}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                咨询链接<span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="inquiryLink"
                value={formData.inquiry_link}
                onChange={handleInputChange}
                onBlur={handleBlur('inquiryLink')}
                style={{
                  height: '34px',
                  backgroundColor: '#f5f5f5',
                  boxShadow: 'inset 0 0 0 1px transparent'
                }}
                className={`mt-1 block w-full rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-black focus:shadow-[inset_0_0_0_1px_black] ${
                  errors.inquiry_link ? 'border-red-500' : ''
                }`}
              />
              {errors.inquiry_link && (
                <p className="text-red-500 text-sm mt-1">{errors.inquiry_link}</p>
              )}
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
// 新增商品操作
const handleCreateProduct = async (productData) => {
  const { data, error } = await supabase
    .from('campaign_products')
    .insert([productData])
    .select('*')
  
  if (error) throw new Error(`新增失败: ${error.message}`)
  if (!data || data.length === 0) throw new Error('新增成功但未返回数据')
  return data[0]
}


const handleUpdateProduct = async (productData, productId) => {
  try {
    console.log('开始更新商品操作')
    console.log('商品ID:', productId)
    console.log('更新数据:', JSON.stringify(productData, null, 2))

    // 获取当前商品数据
    const { data: currentData, error: fetchError } = await supabase
      .from('campaign_products')
      .select('*')
      .eq('id', productId)
      .single()

    if (fetchError) {
      console.error('获取当前商品数据失败:', fetchError)
      throw new Error(`获取当前商品数据失败: ${fetchError.message}`)
    }

    // 比较并生成更新数据
    const updatedFields = {}
    for (const key in productData) {
      if (productData[key] !== currentData[key]) {
        updatedFields[key] = productData[key]
      }
    }

    // 如果没有字段被修改
    if (Object.keys(updatedFields).length === 0) {
      console.log('没有字段被修改，跳过更新')
      return currentData
    }

    // 添加更新时间戳
    updatedFields.updated_at = new Date().toISOString()

    console.log('实际更新的字段:', JSON.stringify(updatedFields, null, 2))

    // 执行更新操作
    console.log('正在执行数据库更新...')
    const { data, error } = await supabase
      .from('campaign_products')
      .update(updatedFields)
      .eq('id', productId)
      .select()
      .single()

    console.log('数据库更新完成')
    console.log('返回数据:', JSON.stringify(data, null, 2))
    console.log('返回错误:', error)

    if (error) {
      console.error('数据库更新失败:', error)
      throw new Error(`更新失败: ${error.message}`)
    }

    if (!data) {
      console.error('数据库更新成功但未返回有效数据')
      throw new Error('更新成功但未返回有效数据')
    }

    console.log('更新成功，返回数据:', JSON.stringify(data, null, 2))
    return data
  } catch (error) {
    console.error('更新商品失败:', error)
    throw error
  }
}

const handleSubmit = async (e) => {
  e.preventDefault()
  
  try {
    // 准备数据
    const productData = {
      name: String(formData.name).trim(),
      description: formData.description ? String(formData.description).trim() : null,
      price: parseFloat(formData.price),  // 使用 price 而不是 current_price
      original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      image_url: formData.image,
      purchase_link: String(formData.purchase_link).trim(),
      inquiry_link: String(formData.inquiry_link).trim(),
      is_recommended: formData.is_recommended,
      created_at: new Date().toISOString()
    }

    console.log('准备提交的数据:', productData)

    // 数据库操作
    const { data, error } = await supabase
      .from('campaign_products')
      .insert([productData])
      .select('*')

    if (error) throw error
    if (!data || data.length === 0) throw new Error('操作成功但未返回数据')

    toast.success('商品添加成功')
    onSubmit(data[0])
  } catch (error) {
    console.error('保存失败:', error)
    toast.error(`保存失败: ${error.message}`)
  } finally {
    setIsLoading(false)
  }
}