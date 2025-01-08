import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function TestConnection() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true)
        
        // 查询 public schema 下的所有表
        const { data, error } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public')
        
        if (error) throw error
        
        setTables(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTables()
  }, [])

  if (loading) return <div>Loading tables...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Database Tables</h2>
      <ul className="space-y-2">
        {tables.map((table) => (
          <li key={table.tablename} className="bg-white p-3 rounded-lg shadow">
            {table.tablename}
          </li>
        ))}
      </ul>
    </div>
  )
}