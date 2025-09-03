'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SupabaseTest() {
  const [status, setStatus] = useState('Testing connection...')
  const [rooms, setRooms] = useState<any[]>([])

  useEffect(() => {
    async function testConnection() {
      try {
        // Test basic connection
        const { data, error } = await supabase
          .from('game_rooms')
          .select('*')
          .limit(5)

        if (error) {
          setStatus(`Error: ${error.message}`)
        } else {
          setStatus(`✅ Connected! Found ${data?.length || 0} rooms`)
          setRooms(data || [])
        }
      } catch (err) {
        setStatus(`❌ Connection failed: ${err}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Supabase Connection Test</h3>
      <p className="mb-4">{status}</p>
      
      {rooms.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Recent Rooms:</h4>
          <ul className="space-y-1">
            {rooms.map((room) => (
              <li key={room.id} className="text-sm text-gray-600">
                {room.code} - {room.game_type}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
