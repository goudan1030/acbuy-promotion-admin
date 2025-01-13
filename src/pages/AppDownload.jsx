import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'react-toastify'

export default function AppDownload() {
  const [links, setLinks] = useState({
    ios_app_store: '',
    android_google_play: '',
    android_direct_download: '',
    huawei_app_gallery: '',
    xiaomi_app_store: '',
    oppo_app_store: '',
    vivo_app_store: '',
    samsung_galaxy_store: ''
  })
  const [loading, setLoading] = useState(false)

  // 获取现有配置
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('app_downloads')
          .select('*')
          .single()

        if (error && error.code !== 'PGRST116') throw error
        if (data) setLinks(data)
      } catch (error) {
        console.error('获取APP下载链接失败:', error)
        toast.error('获取配置失败')
      }
    }

    fetchLinks()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('app_downloads')
        .upsert({
          id: 1,
          ...links,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('配置保存成功')
    } catch (error) {
      console.error('保存APP下载链接失败:', error)
      toast.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">APP下载管理</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* iOS App Store */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              iOS App Store
            </label>
            <input
              type="url"
              value={links.ios_app_store}
              onChange={(e) => setLinks(prev => ({
                ...prev,
                ios_app_store: e.target.value
              }))}
              className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="https://apps.apple.com/..."
            />
          </div>

          {/* Google Play */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Play
            </label>
            <input
              type="url"
              value={links.android_google_play}
              onChange={(e) => setLinks(prev => ({
                ...prev,
                android_google_play: e.target.value
              }))}
              className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="https://play.google.com/store/apps/..."
            />
          </div>

          {/* Android 直接下载 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Android 直接下载
            </label>
            <input
              type="url"
              value={links.android_direct_download}
              onChange={(e) => setLinks(prev => ({
                ...prev,
                android_direct_download: e.target.value
              }))}
              className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="https://download.example.com/app.apk"
            />
          </div>

          {/* 华为应用市场 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              华为应用市场
            </label>
            <input
              type="url"
              value={links.huawei_app_gallery}
              onChange={(e) => setLinks(prev => ({
                ...prev,
                huawei_app_gallery: e.target.value
              }))}
              className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="https://appgallery.huawei.com/..."
            />
          </div>

          {/* 小米应用商店 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              小米应用商店
            </label>
            <input
              type="url"
              value={links.xiaomi_app_store}
              onChange={(e) => setLinks(prev => ({
                ...prev,
                xiaomi_app_store: e.target.value
              }))}
              className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="https://app.mi.com/..."
            />
          </div>

          {/* OPPO应用商店 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OPPO应用商店
            </label>
            <input
              type="url"
              value={links.oppo_app_store}
              onChange={(e) => setLinks(prev => ({
                ...prev,
                oppo_app_store: e.target.value
              }))}
              className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="https://store.oppo.com/..."
            />
          </div>

          {/* vivo应用商店 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              vivo应用商店
            </label>
            <input
              type="url"
              value={links.vivo_app_store}
              onChange={(e) => setLinks(prev => ({
                ...prev,
                vivo_app_store: e.target.value
              }))}
              className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="https://store.vivo.com/..."
            />
          </div>

          {/* 三星应用商店 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              三星 Galaxy Store
            </label>
            <input
              type="url"
              value={links.samsung_galaxy_store}
              onChange={(e) => setLinks(prev => ({
                ...prev,
                samsung_galaxy_store: e.target.value
              }))}
              className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="https://galaxystore.samsung.com/..."
            />
          </div>

          {/* 保存按钮 */}
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