import supabase from '../config/supabase'

// 获取所有商品
export const getProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('获取商品失败:', error)
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
    console.log('开始更新商品:', { productId, productData })

    // 1. 先检查商品是否存在
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)

    if (checkError) {
      console.error('检查商品失败:', checkError)
      throw new Error(`检查商品失败: ${checkError.message}`)
    }

    if (!existingProduct || existingProduct.length === 0) {
      throw new Error(`商品不存在: ${productId}`)
    }

    console.log('找到现有商品:', existingProduct[0])

    // 2. 执行更新
    const updatePayload = {
      ...productData,
      updated_at: new Date().toISOString()
    }

    console.log('更新数据:', updatePayload)

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId)
      .select()

    if (error) {
      console.error('更新失败:', error)
      throw new Error(`更新失败: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('更新后未返回数据')
    }

    console.log('更新成功:', data[0])
    return data[0]
  } catch (error) {
    console.error('更新商品失败:', error)
    throw error
  }
}