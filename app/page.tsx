'use client'

import { useState } from 'react'
import OrdersList from './components/OrdersList'

export default function Home() {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    const url = `${window.location.origin}/order`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">InstaOrders</h1>
        <p className="text-gray-500 mb-6">Seller dashboard — orders update live as buyers place them</p>

        {/* Shareable buyer link */}
        <div className="bg-white rounded-2xl shadow p-5 mb-8">
          <p className="font-semibold text-gray-800 mb-1">Your order link</p>
          <p className="text-sm text-gray-500 mb-3">Share this with buyers so they can place orders.</p>
          <div className="flex gap-2 flex-wrap">
            <button onClick={copyLink}
              className="bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
              {copied ? 'Copied! ✓' : 'Copy link'}
            </button>
            <a href="/order" target="_blank" rel="noopener noreferrer"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition">
              Open order page ↗
            </a>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-4">Incoming orders</h2>
        <OrdersList />
      </div>
    </main>
  )
}
