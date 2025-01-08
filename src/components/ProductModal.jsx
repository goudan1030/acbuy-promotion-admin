import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabaseClient'  // 修正后的路径

export default function ProductModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    originalPrice: '',
    currentPrice: '',
    image: null,
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
        image: initialData.image_url || null,
        recommendation: initialData.recommendation || '',
        purchaseLink: initialData.purchase_link || '',
        inquiryLink: initialData.inquiry_link || ''
      })
    }
    setErrors({})
  }, [initialData, isOpen])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }))
        setErrors(prev => ({ ...prev, image: null }))
      }
      reader.readAsDataURL(file)
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

// ... 其他代码保持不变 ...

const handleSubmit = async (e) => {
  e.preventDefault()
  setIsLoading(true)
  
  try {
    // 1. 数据验证
    const requiredFields = ['name', 'category', 'currentPrice', 'purchaseLink', 'inquiryLink']
    const isValid = requiredFields.every(field => {
      const value = formData[field]
      
      // 检查字段是否存在且不为空
      if (value === null || value === undefined || value === '') {
        setErrors(prev => ({...prev, [field]: '该字段为必填项'}))
        return false
      }
      
      // 如果是字符串，去除前后空格后检查是否为空
      if (typeof value === 'string' && value.trim() === '') {
        setErrors(prev => ({...prev, [field]: '该字段为必填项'}))
        return false
      }
      
      return true
    })

    if (!isValid) {
      toast.error('请填写所有必填项')
      setIsLoading(false)
      return
    }

    // 2. 处理图片上传
    let imageUrl = formData.image
    if (formData.image && typeof formData.image !== 'string') {
      // 如果是文件对象，进行上传
      const file = formData.image
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `product-images/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('product-images')  // 你的存储桶名称
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`图片上传失败: ${uploadError.message}`)
      }

      // 获取图片URL
      const { data: urlData } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(filePath)

      imageUrl = urlData.publicUrl
    }

    // 3. 准备数据
    const productData = {
      name: String(formData.name).trim(),
      category: formData.category,  // 直接使用原始值，不进行字符串转换
      original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      current_price: parseFloat(formData.currentPrice),
      image_url: imageUrl,
      recommendation: formData.recommendation ? String(formData.recommendation).trim() : null,
      purchase_link: String(formData.purchaseLink).trim(),
      inquiry_link: String(formData.inquiryLink).trim(),
      updated_at: new Date().toISOString()
    }

    // 4. 数据库操作
    let result
    if (initialData && initialData.id) {
      // 编辑操作 - 更新现有商品
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', initialData.id)
        .select('*')
      
      if (error) {
        console.error('更新商品失败:', error)
        throw new Error(`更新商品失败: ${error.message}`)
      }
      
      result = data?.[0]
    } else {
      // 新增操作 - 创建新商品
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select('*')
      
      if (error) {
        console.error('新增商品失败:', error)
        throw new Error(`新增商品失败: ${error.message}`)
      }
      
      result = data?.[0]
    }

    // 5. 验证数据库操作结果
    if (!result) {
      throw new Error('数据库操作成功但未返回有效数据')
    }

    // 6. 成功处理
    toast.success(`商品${initialData ? '更新' : '添加'}成功`)
    onSubmit(result)
  } catch (error) {
    console.error('保存失败:', error)
    toast.error(error.message)
  } finally {
    setIsLoading(false)
  }
}

// ... 其他代码保持不变 ...
  

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
            <div className="mt-1 flex items-center">
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
              {formData.image && (
                <img
                  src={formData.image}
                  alt="预览"
                  className="ml-4 w-20 h-20 object-cover rounded-md"
                />
              )}
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
// 新增商品操作
const handleCreateProduct = async (productData) => {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select('*')
  
  if (error) throw new Error(`新增失败: ${error.message}`)
  if (!data || data.length === 0) throw new Error('新增成功但未返回数据')
  return data[0]
}


// ... 其他代码保持不变 ...

// ... 其他代码保持不变 ...

// 更新商品操作
const handleUpdateProduct = async (productData, productId) => {
  try {
    console.log('开始更新商品操作')
    console.log('商品ID:', productId)
    console.log('更新数据:', JSON.stringify(productData, null, 2))

    // 获取当前商品数据
    const { data: currentData, error: fetchError } = await supabase
      .from('products')
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
      .from('products')
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

// ... 其他代码保持不变 ...

const handleSubmit = async (e) => {
  e.preventDefault()
  console.log('表单提交开始')
  setIsLoading(true)

  try {
    console.log('开始数据验证')
    // 1. 数据验证
    const requiredFields = ['name', 'category', 'currentPrice', 'purchaseLink', 'inquiryLink']
    const isValid = requiredFields.every(field => {
      const value = formData[field]
      
      // 检查字段是否存在且不为空
      if (value === null || value === undefined || value === '') {
        setErrors(prev => ({...prev, [field]: '该字段为必填项'}))
        return false
      }
      
      // 如果是字符串，去除前后空格后检查是否为空
      if (typeof value === 'string' && value.trim() === '') {
        setErrors(prev => ({...prev, [field]: '该字段为必填项'}))
        return false
      }
      
      return true
    })

    if (!isValid) {
      console.log('数据验证失败')
      toast.error('请填写所有必填项')
      setIsLoading(false)
      return
    }
    console.log('数据验证通过')

    // 2. 准备数据
    console.log('准备数据')
    const productData = {
      name: String(formData.name).trim(),
      category: formData.category,
      original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      current_price: parseFloat(formData.currentPrice),
      image_url: imageUrl,
      recommendation: formData.recommendation ? String(formData.recommendation).trim() : null,
      purchase_link: String(formData.purchaseLink).trim(),
      inquiry_link: String(formData.inquiryLink).trim(),
      updated_at: new Date().toISOString()
    }
    console.log('准备完成的数据:', JSON.stringify(productData, null, 2))

    // 3. 执行操作
    console.log('开始执行数据库操作')
    let result
    if (initialData && initialData.id) {
      console.log('执行更新操作')
      result = await handleUpdateProduct(productData, initialData.id)
    } else {
      console.log('执行新增操作')
      result = await handleCreateProduct(productData)
    }

    // 4. 成功处理
    console.log('操作成功，返回结果:', JSON.stringify(result, null, 2))
    toast.success(`商品${initialData ? '更新' : '添加'}成功`)
    onSubmit(result)
  } catch (error) {
    console.error('保存失败:', error)
    toast.error(error.message)
  } finally {
    console.log('表单提交结束')
    setIsLoading(false)
  }
}

// ... 其他代码保持不变 ...
