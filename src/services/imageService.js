import { supabase } from '../supabaseClient'

// 上传图片
export const uploadImage = async (file) => {
  try {
    // 生成唯一文件名
    const timestamp = new Date().getTime()
    const randomString = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomString}.${extension}`

    // 上传到 storage
    const { error: uploadError } = await supabase.storage
      .from('traffic-products')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // 获取公开访问 URL
    const { data: { publicUrl } } = supabase.storage
      .from('traffic-products')
      .getPublicUrl(fileName)

    // 保存图片记录
    const { data, error } = await supabase
      .from('images')
      .insert([
        {
          file_name: fileName,
          file_path: `traffic-products/${fileName}`,
          public_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          bucket_name: 'traffic-products'
        }
      ])
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('上传图片失败:', error)
    throw new Error('上传图片失败')
  }
}

// 删除图片
export const deleteImage = async (imageId) => {
  try {
    // 获取图片信息
    const { data: image, error: getError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (getError) throw getError

    // 从 storage 删除文件
    const { error: deleteStorageError } = await supabase.storage
      .from('traffic-products')
      .remove([image.file_name])

    if (deleteStorageError) throw deleteStorageError

    // 从数据库删除记录
    const { error: deleteDbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId)

    if (deleteDbError) throw deleteDbError

    return true
  } catch (error) {
    console.error('删除图片失败:', error)
    throw new Error('删除图片失败')
  }
} 