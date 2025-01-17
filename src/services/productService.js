import supabase from '../config/supabase'

// 获取所有商品
export const getProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        image:image_id (
          id,
          public_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('获取商品列表失败:', error)
    throw error
  }
}

// 获取分类
export const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)  // 确保category不为null
      .order('category', { ascending: true })

    if (error) throw error

    // 去重并返回分类数组
    const uniqueCategories = [...new Set(data.map(item => item.category))]
    return uniqueCategories
  } catch (error) {
    console.error('获取分类失败:', error)
    throw error
  }
}

// 根据分类获取商品
export const getProductsByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)  // 使用eq查询
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('获取分类商品失败:', error)
    throw error
  }
}

// 查询多个分类
export const getProductsByCategories = async (categories) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('category', categories)  // 使用in查询
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('获取分类商品失败:', error)
    throw error
  }
}

// 删除商品
export const deleteProduct = async (productId) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('删除商品失败:', error)
    throw error
  }
}

// 更新商品
export const updateProduct = async (productId, productData) => {
  try {
    // 构建更新数据
    const updatePayload = {
      name: productData.name,
      current_price: productData.current_price,
      original_price: productData.original_price,
      category: productData.category,
      description: productData.description,
      updated_at: new Date().toISOString()
    }

    // 如果有新的图片ID，添加到更新数据中
    if (productData.image_id) {
      updatePayload.image_id = productData.image_id
    }

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId)
      .select(`
        *,
        image:image_id (
          id,
          public_url
        )
      `)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('更新商品失败:', error)
    throw error
  }
}