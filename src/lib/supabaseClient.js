import { createClient } from '@supabase/supabase-js'

// 调试输出
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_KEY:', import.meta.env.VITE_SUPABASE_KEY)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('环境变量加载失败，请检查：')
  console.error('1. .env文件是否存在')
  console.error('2. 环境变量名称是否正确')
  console.error('3. 是否重启了开发服务器')
  throw new Error('请检查.env文件中的VITE_SUPABASE_URL和VITE_SUPABASE_KEY配置')
}

export const supabase = createClient(supabaseUrl, supabaseKey)