import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function AppModal({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    description: '',
    download_url: '',
    image_id: null,
    previewUrl: null
  })

  // 新增：临时文件状态
  const [selectedFile, setSelectedFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        version: initialData.version || '',
        description: initialData.description || '',
        download_url: initialData.download_url || '',
        image_id: initialData.image_id || null,
        previewUrl: initialData.image?.public_url || null
      })
      // 清除之前可能存在的临时文件
      setSelectedFile(null)
    }
  }, [initialData])

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 所有字段都可以为空，不需要验证
    setIsLoading(true)
    const toastId = toast.loading('正在保存...', {
      position: 'top-center'
    })

    try {
      let imageId = formData.imageId
      console.log('开始处理表单提交，当前图片ID:', imageId)
      console.log('是否有新选择的图片:', !!selectedFile)

      // 如果有新选择的图片，先上传图片
      if (selectedFile) {
        try {
          console.log('开始处理新图片上传')
          
          // 压缩图片
          const compressedFile = await compressImage(selectedFile)
          console.log('图片压缩完成，开始上传')
          
          // 上传图片并获取图片记录
          const imageData = await uploadImage(compressedFile)
          console.log('新图片上传成功:', imageData)
          
          imageId = imageData.id

          // 如果有旧图片，删除它
          if (formData.imageId) {
            console.log('准备删除旧图片:', formData.imageId)
            await deleteImage(formData.imageId).catch(error => {
              console.error('删除旧图片失败:', error)
            })
          }
        } catch (error) {
          console.error('图片处理详细错误:', error)
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

      const appData = {
        name: formData.name.trim() || null,
        version: formData.version.trim() || null,
        description: formData.description.trim() || null,
        download_url: formData.download_url.trim() || null,
        image_id: imageId
      }

      console.log('准备提交的应用数据:', appData)

      await onSubmit(appData)
      
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
      console.error('保存失败详细错误:', error)
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

  // ... 其他代码保持不变
} 