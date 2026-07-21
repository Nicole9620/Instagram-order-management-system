'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AddOrderForm({ onOrderAdded }: { onOrderAdded: () => void }) {
  const [form, setForm] = useState({
    customer_name: '',
    item_name: '',
    variant: '',
    price: '',
    address: '',
    payment_status: 'unpaid',
    order_status: 'pending'
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    if (!form.customer_name || !form.item_name || !form.price) {
      alert('Please fill in customer name, item and price')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('orders').insert([{
      ...form,
      price: parseFloat(form.price)
    }])
    if (error) {
      alert('Error saving order: ' + error.message)
    } else {
      setForm({
        customer_name: '',
        item_name: '',
        variant: '',
        price: '',
        address: '',
        payment_status: 'unpaid',
        order_status: 'pending'
      })
      onOrderAdded()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 w-full max-w-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Order</h2>

      <div className="flex flex-col gap-3">
        <input name="customer_name" value={form.customer_name} onChange={handleChange}
          placeholder="Customer Name *" className="border !text-black rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 " />

        <input name="item_name" value={form.item_name} onChange={handleChange}
          placeholder="Item Name *" className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 !text-black" />

        <input name="variant" value={form.variant} onChange={handleChange}
          placeholder="Variant (e.g. Size M, Red)" className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 !text-black" />

        <input name="price" value={form.price} onChange={handleChange}
          placeholder="Price (₹) *" type="number" className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 !text-black" />

        <input name="address" value={form.address} onChange={handleChange}
          placeholder="Delivery Address" className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 !text-black" />

        <select name="payment_status" value={form.payment_status} onChange={handleChange}
          className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 !text-black">
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>

        <button onClick={handleSubmit} disabled={loading}
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50">
          {loading ? 'Saving...' : 'Add Order'}
        </button>
      </div>
    </div>
  )
}