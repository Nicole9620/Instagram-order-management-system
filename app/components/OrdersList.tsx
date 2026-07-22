'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import OrderCard from './OrderCard'
import { type Order } from '../lib/types'

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newOrderFlash, setNewOrderFlash] = useState(false)

  const fetchOrders = useCallback(async () => {
    setError(null)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) setError(error.message)
      else if (data) setOrders(data.filter((o) => !o.closed))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the server')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Live updates: refetch whenever any order changes, and flash a banner on new orders.
  useEffect(() => {
    const channel = supabase
      .channel('orders-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders()
        if (payload.eventType === 'INSERT') {
          setNewOrderFlash(true)
          setTimeout(() => setNewOrderFlash(false), 5000)
        }
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  if (loading) return <p className="text-gray-400 text-sm">Loading orders...</p>
  if (error) return <p className="text-red-500 text-sm">Could not load orders: {error}</p>
  if (orders.length === 0) return <p className="text-gray-400 text-sm">No orders yet. Share your order link to get started!</p>

  return (
    <div className="flex flex-col gap-3">
      {newOrderFlash && (
        <div className="bg-pink-100 text-pink-700 text-sm font-medium rounded-lg px-4 py-2 animate-pulse">
          🔔 New order just came in!
        </div>
      )}
      {orders.map(order => (
        <OrderCard key={order.id} order={order} onUpdated={fetchOrders} />
      ))}
    </div>
  )
}
