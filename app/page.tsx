'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Sheet {
  id: number
  title: string
  artist: string
  instrument: string
  image_urls: string[]
}

export default function Home() {
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchSheets()
  }, [])

  const fetchSheets = async () => {
    const { data, error } = await supabase.from('sheets').select('*')
    if (data) setSheets(data)
  }

  const filteredSheets = sheets.filter(
    (sheet) =>
      sheet.title.toLowerCase().includes(search.toLowerCase()) ||
      sheet.artist.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">🎵 我的樂譜庫</h1>
        <Link
          href="/upload"
          className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700"
        >
          + 上傳新樂譜
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="搜尋歌名或歌手..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSheets.map((sheet) => (
          <div key={sheet.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="bg-gray-100 h-64 overflow-y-auto p-2 space-y-2">
              {sheet.image_urls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`${sheet.title} 頁 ${idx + 1}`}
                  className="w-full rounded border"
                />
              ))}
            </div>
            <div className="p-4 bg-white">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {sheet.instrument}
              </span>
              <h2 className="text-xl font-bold mt-2 text-gray-800">{sheet.title}</h2>
              <p className="text-gray-600 text-sm">{sheet.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}