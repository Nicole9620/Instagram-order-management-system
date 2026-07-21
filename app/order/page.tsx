'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function OrderPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    customer_name: '',
    item_name: '',
    variant: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    if (!form.customer_name.trim() || !form.item_name.trim()) {
      setError('Please enter your name and what you want to order.')
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('orders')
      .insert([{ ...form, order_status: 'pending', payment_status: 'unpaid' }])
      .select()
      .single()

    if (error || !data) {
      setError(error?.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }
    // Send the buyer to their live tracking page.
    router.push(`/track/${data.id}`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Place an order</h1>
        <p className="text-gray-500 text-sm mb-5">
          Tell the seller what you&apos;d like. They&apos;ll confirm it and set the price.
        </p>

        <div className="flex flex-col gap-3">
          <input name="customer_name" value={form.customer_name} onChange={handleChange}
            placeholder="Your name *" className="border text-black rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300" />

          <input name="item_name" value={form.item_name} onChange={handleChange}
            placeholder="Item Name or Order ID *" className="border text-black rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300" />

          <input name="variant" value={form.variant} onChange={handleChange}
            type="number" min="1" placeholder="Quantity" className="border text-black rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300" />

          <textarea name="address" value={form.address} onChange={handleChange}
            placeholder="Delivery address" rows={3}
            className="border text-black rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 resize-none" />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50">
            {loading ? 'Sending...' : 'Send order to seller'}
          </button>
        </div>
      </div>
    </main>
  )
}
