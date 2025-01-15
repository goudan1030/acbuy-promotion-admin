import { useState } from 'react'
import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'

export default function ImportModal({ isOpen, onClose, onSuccess }) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)

  // 下载模板
  const downloadTemplate = () => {
    // 模板数据
    const template = [
      {
        name: '示例商品',
        category: '示例分类',
        current_price: '99.99',
        image_url: 'https://example.com/image.jpg',
        qc_image_url: 'https://example.com/qc-image.jpg',
        purchase_link: 'https://example.com/product'
      }
    ]

    // 创建工作簿
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(template)

    // 添加字段说明
    const remarks = [
      ['字段说明：'],
      ['name', '商品名称（必填）'],
      ['category', '商品分类（必填）'],
      ['current_price', '商品价格（必填，数字）'],
      ['image_url', '商品图片URL（必填）'],
      ['qc_image_url', 'QC图片URL（必填）'],
      ['purchase_link', '购买链接（必填）']
    ]
    
    const wsRemarks = XLSX.utils.aoa_to_sheet(remarks)
    
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '导入模板')
    XLSX.utils.book_append_sheet(wb, wsRemarks, '填写说明')

    // 下载文件
    XLSX.writeFile(wb, '导流商品导入模板.xlsx')
  }

  // 处理文件拖放
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  // 处理文件选择
  const handleFileSelect = (file) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('请上传 Excel 文件')
      return
    }
    setSelectedFile(file)
  }

  // 验证数据
  const validateData = (data) => {
    const errors = []
    data.forEach((row, index) => {
      if (!row.name) errors.push(`第 ${index + 1} 行：商品名称不能为空`)
      if (!row.category) errors.push(`第 ${index + 1} 行：商品分类不能为空`)
      if (!row.current_price || isNaN(row.current_price)) {
        errors.push(`第 ${index + 1} 行：商品价格必须为数字`)
      }
      if (!row.image_url) errors.push(`第 ${index + 1} 行：商品图片URL不能为空`)
      if (!row.qc_image_url) errors.push(`第 ${index + 1} 行：QC图片URL不能为空`)
      if (!row.purchase_link) errors.push(`第 ${index + 1} 行：购买链接不能为空`)
    })
    return errors
  }

  // 处理导入
  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('请选择文件')
      return
    }

    setLoading(true)
    const toastId = toast.loading('正在导入...')

    try {
      // 读取文件
      const reader = new FileReader()
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // 验证数据
        const errors = validateData(jsonData)
        if (errors.length > 0) {
          toast.update(toastId, {
            render: '数据验证失败：\n' + errors.join('\n'),
            type: 'error',
            isLoading: false,
            autoClose: 5000
          })
          setLoading(false)
          return
        }

        // 准备导入数据
        const productsToInsert = jsonData.map(row => ({
          name: row.name,
          category: row.category,
          current_price: parseFloat(row.current_price),
          image_url: row.image_url,
          qc_image_url: row.qc_image_url,
          purchase_link: row.purchase_link,
          created_at: new Date().toISOString()
        }))

        // 批量插入数据
        const { error } = await supabase
          .from('traffic_products')
          .insert(productsToInsert)

        if (error) throw error

        toast.update(toastId, {
          render: `成功导入 ${productsToInsert.length} 个商品`,
          type: 'success',
          isLoading: false,
          autoClose: 3000
        })

        onSuccess()
        onClose()
      }

      reader.readAsArrayBuffer(selectedFile)
    } catch (error) {
      console.error('导入失败:', error)
      toast.update(toastId, {
        render: `导入失败: ${error.message}`,
        type: 'error',
        isLoading: false,
        autoClose: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">导入商品</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* 导入说明 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">导入说明：</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>请使用标准Excel模板填写商品数据</li>
            <li>填写时请删除示例数据行，从第一行开始填写实际数据</li>
            <li>建议单次导入不超过100个商品</li>
            <li>所有必填字段不能为空</li>
            <li>图片URL必须是可访问的完整链接地址</li>
            <li>商品价格必须为数字，支持两位小数</li>
            <li>导入前请仔细检查数据格式是否正确</li>
          </ul>
        </div>

        {/* 下载模板区域 */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium mb-2">第一步：下载导入模板</h3>
              <p className="text-sm text-gray-500">请使用标准模板，确保数据格式正确</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              下载模板
            </button>
          </div>
        </div>

        {/* 上传区域 */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">第二步：上传填写好的模板</h3>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-black bg-gray-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-gray-600"
            >
              <div className="space-y-2">
                <div className="flex justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-sm">
                  <span className="text-black font-medium">点击上传</span> 或拖放文件到这里
                </div>
                <p className="text-xs text-gray-500">
                  支持 .xlsx, .xls 格式
                </p>
              </div>
            </label>
            {selectedFile && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  已选择：{selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  提示：点击"导入商品"按钮开始导入，导入过程中请勿关闭窗口
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || loading}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '导入中...' : '导入商品'}
          </button>
        </div>
      </div>
    </div>
  )
} 