import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,  // 使用import.meta.env访问Vite环境变量
  import.meta.env.VITE_SUPABASE_KEY
)

export default supabase