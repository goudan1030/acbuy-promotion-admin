import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'react-toastify'

export default function TrackingCode() {
  const [codes, setCodes] = useState({
    google_analytics: '',
    facebook_pixel: '',
    tiktok_pixel: '',
    custom_head: '',
    custom_body: ''
  })
  const [loading, setLoading] = useState(false)

  // 获取现有配置
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const { data, error } = await supabase
          .from('tracking_codes')
          .select('*')
          .single()

        if (error && error.code !== 'PGRST116') throw error
        if (data) setCodes(data)
      } catch (error) {
        console.error('获取统计代码失败:', error)
        toast.error('获取配置失败')
      }
    }

    fetchCodes()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('tracking_codes')
        .upsert({
          id: 1, // 使用固定ID
          ...codes,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('配置保存成功')
    } catch (error) {
      console.error('保存统计代码失败:', error)
      toast.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">统计代码配置</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Google Analytics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Analytics
            </label>
            <textarea
              value={codes.google_analytics}
              onChange={(e) => setCodes(prev => ({
                ...prev,
                google_analytics: e.target.value
              }))}
              className="w-full h-32 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="<!-- Google Analytics 代码 -->"
            />
          </div>

          {/* Facebook Pixel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook Pixel
            </label>
            <textarea
              value={codes.facebook_pixel}
              onChange={(e) => setCodes(prev => ({
                ...prev,
                facebook_pixel: e.target.value
              }))}
              className="w-full h-32 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="<!-- Facebook Pixel 代码 -->"
            />
          </div>

          {/* TikTok Pixel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TikTok Pixel
            </label>
            <textarea
              value={codes.tiktok_pixel}
              onChange={(e) => setCodes(prev => ({
                ...prev,
                tiktok_pixel: e.target.value
              }))}
              className="w-full h-32 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="<!-- TikTok Pixel 代码 -->"
            />
          </div>

          {/* 自定义Head代码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              自定义Head代码
            </label>
            <textarea
              value={codes.custom_head}
              onChange={(e) => setCodes(prev => ({
                ...prev,
                custom_head: e.target.value
              }))}
              className="w-full h-32 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="<!-- 将插入到 </head> 标签前 -->"
            />
          </div>

          {/* 自定义Body代码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              自定义Body代码
            </label>
            <textarea
              value={codes.custom_body}
              onChange={(e) => setCodes(prev => ({
                ...prev,
                custom_body: e.target.value
              }))}
              className="w-full h-32 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="<!-- 将插入到 </body> 标签前 -->"
            />
          </div>

          {/* 修改保存按钮的容器样式 */}
          <div className="sticky bottom-0 bg-white pt-4 pb-4 border-t mt-6">
            <div className="flex justify-end max-w-4xl mx-auto">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minWidth: '120px' }}
              >
                {loading ? '保存中...' : '保存配置'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 