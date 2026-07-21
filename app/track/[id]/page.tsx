'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { STATUS_FLOW, type Order } from '../../lib/types'
import { formatDateTime } from '../../lib/format'
import PaymentModal from '../../components/PaymentModal'

const STEPS = [
  { label: 'Order placed', desc: 'We received your request' },
  { label: 'Confirmed by seller', desc: 'Seller accepted your order' },
  { label: 'Packed', desc: 'Your order has been packed' },
  { label: 'Shipped', desc: 'On the way to you' },
  { label: 'Delivered', desc: 'Order delivered — enjoy!' },
]

export default function TrackPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [justUpdated, setJustUpdated] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
    if (error || !data) setNotFound(true)
    else setOrder(data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Live updates: when the seller changes this order, refetch instantly.
  useEffect(() => {
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        () => {
          load()
          setJustUpdated(true)
          setTimeout(() => setJustUpdated(false), 4000)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, load])

  // Prompt for payment as soon as the order is confirmed but not yet paid.
  const orderStatus = order?.order_status
  const paymentStatus = order?.payment_status
  useEffect(() => {
    if (orderStatus && orderStatus !== 'pending' && paymentStatus === 'unpaid') {
      setShowPayModal(true)
    }
  }, [orderStatus, paymentStatus])

  if (loading) return <Centered><p className="text-gray-400">Loading your order...</p></Centered>
  if (notFound || !order) return <Centered><p className="text-gray-500">Sorry, we couldn&apos;t find that order.</p></Centered>

  const currentStep = STATUS_FLOW.indexOf(order.order_status as (typeof STATUS_FLOW)[number])

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Hi {order.customer_name} 👋</h1>
        <p className="text-gray-500 text-sm mb-1">Here&apos;s the live status of your order.</p>
        {justUpdated && (
          <p className="text-pink-600 text-sm font-medium animate-pulse mb-1">✨ Status just updated!</p>
        )}

        <div className="bg-white rounded-2xl shadow p-5 mt-4">
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="font-bold text-gray-800">{order.item_name}</p>
              {order.variant && <p className="text-sm text-gray-500">{order.variant}</p>}
            </div>
            <p className="font-bold text-gray-800">
              {order.price != null ? `₹${order.price}` : <span className="text-sm font-normal text-gray-400">price pending</span>}
            </p>
          </div>
          {order.address && <p className="text-xs text-gray-400 mb-2">📍 {order.address}</p>}

          {order.order_status === 'pending' && (
            <div className="bg-yellow-50 text-yellow-700 text-sm rounded-lg px-3 py-2 mt-2">
              ⏳ Waiting for the seller to confirm your order...
            </div>
          )}

          {/* Payment state (once confirmed) */}
          {order.order_status !== 'pending' && (
            <div className="mt-2">
              {order.payment_status === 'unpaid' && (
                <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <span>⚠️ Payment pending — your order is packed after payment.</span>
                  <button onClick={() => setShowPayModal(true)} className="font-semibold underline whitespace-nowrap">Pay now</button>
                </div>
              )}
              {order.payment_status === 'submitted' && (
                <div className="bg-blue-50 text-blue-700 text-sm rounded-lg px-3 py-2">
                  🕓 Payment proof sent — waiting for the seller to verify.
                </div>
              )}
              {order.payment_status === 'paid' && (
                <div className="bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2">
                  ✅ Payment verified.
                </div>
              )}
            </div>
          )}

          <p className="text-[11px] text-gray-400 border-t pt-2 mt-3">
            Placed {formatDateTime(order.created_at)} · Updated {formatDateTime(order.updated_at)}
          </p>
        </div>

        {/* Progress tracker */}
        <div className="bg-white rounded-2xl shadow p-5 mt-4">
          <ol className="flex flex-col gap-0">
            {STEPS.map((step, i) => {
              const done = i <= currentStep
              const active = i === currentStep
              const isLast = i === STEPS.length - 1
              return (
                <li key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition
                        ${done ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-400'}
                        ${active ? 'ring-4 ring-pink-200' : ''}`}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    {!isLast && <div className={`w-0.5 flex-1 min-h-8 ${i < currentStep ? 'bg-pink-500' : 'bg-gray-200'}`} />}
                  </div>
                  <div className={`pb-6 ${done ? '' : 'opacity-50'}`}>
                    <p className={`font-semibold text-sm ${active ? 'text-pink-600' : 'text-gray-800'}`}>{step.label}</p>
                    <p className="text-xs text-gray-400">{step.desc}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Keep this page open — it updates automatically.
        </p>
      </div>

      {showPayModal && <PaymentModal order={order} onClose={() => setShowPayModal(false)} />}
    </main>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-6">
      {children}
    </main>
  )
}
