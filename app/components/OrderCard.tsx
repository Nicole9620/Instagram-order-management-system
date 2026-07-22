'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { type Order } from '../lib/types'
import { formatDateTime } from '../lib/format'


const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
}

const paymentColors: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-600',
  paid: 'bg-green-100 text-green-600',
}

// Statuses the seller can set after an order is confirmed.
const advanceStatuses = ['confirmed', 'packed', 'shipped', 'delivered']
const paymentStatuses = ['unpaid', 'paid']

// These stages can't start until the payment is verified.
const requiresPayment = ['packed', 'shipped', 'delivered']

export default function OrderCard({ order, onUpdated }: { order: Order; onUpdated: () => void }) {
  const [updating, setUpdating] = useState(false)
  const [priceInput, setPriceInput] = useState('')
  const [showProof, setShowProof] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  async function update(fields: Partial<Order>) {
    setUpdating(true)
    const { error } = await supabase
      .from('orders')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', order.id)
    if (!error) onUpdated()
    setUpdating(false)
  }

  async function confirmOrder() {
    const price = parseFloat(priceInput)
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price to confirm this order.')
      return
    }
    await update({ order_status: 'confirmed', price })
  }

  const isPending = order.order_status === 'pending'
  const isPaid = order.payment_status === 'paid'
  const currentIndex = advanceStatuses.indexOf(order.order_status)
  const paymentIndex = paymentStatuses.indexOf(order.payment_status)

  return (
    <div className={`bg-white rounded-2xl shadow p-4 flex flex-col gap-3 ${updating ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">{order.customer_name}</p>
          <p className="text-sm text-gray-500"><span className="text-gray-400">Item:</span> {order.item_name}</p>
          {order.variant && (
            <p className="text-sm text-gray-500"><span className="text-gray-400">Quantity:</span> {order.variant}</p>
          )}
        </div>
        <div className="flex items-start gap-2">
          <p className="font-bold text-gray-800">
            {order.price != null ? `₹${order.price}` : <span className="text-sm font-normal text-gray-400">no price</span>}
          </p>
          <button
            onClick={() => setShowCloseConfirm(true)}
            title="Close order"
            className="text-gray-300 hover:text-red-500 text-lg leading-none transition"
          >
            ✕
          </button>
        </div>
      </div>

      {order.address && <p className="text-xs text-gray-400">📍 {order.address}</p>}

      {isPending ? (
        /* New buyer order — confirm it and set the price */
        <div className="bg-yellow-50 rounded-lg p-3 flex flex-col gap-2">
          <p className="text-sm font-medium text-yellow-800">New order — confirm to set the price</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="Price (₹)"
              className="border rounded-lg px-3 py-2 text-sm w-32 outline-none focus:ring-2 focus:ring-pink-300"
            />
            <button
              onClick={confirmOrder}
              disabled={updating}
              className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              Confirm order
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Payment verification */}
          {order.payment_status === 'submitted' ? (
            <div className="bg-blue-50 rounded-lg p-3 flex flex-col gap-2">
              <p className="text-sm font-medium text-blue-800">💰 Buyer says they&apos;ve paid</p>
              {order.payment_proof ? (
                <>
                  <button onClick={() => setShowProof((s) => !s)} className="text-xs text-blue-600 underline self-start">
                    {showProof ? 'Hide proof' : 'View payment proof'}
                  </button>
                  {showProof && <img src={order.payment_proof} alt="payment proof" className="max-h-56 rounded-lg border" />}
                </>
              ) : (
                <p className="text-xs text-blue-600">No screenshot attached.</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => update({ payment_status: 'paid' })}
                  disabled={updating}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  Confirm paid
                </button>
                <button
                  onClick={() => update({ payment_status: 'unpaid', payment_proof: null })}
                  disabled={updating}
                  className="bg-white border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  Not received
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-1">Payment</p>
              <div className="flex gap-2">
                {paymentStatuses.map((status, i) => {
                  const isCurrent = i === paymentIndex
                  const isPast = i < paymentIndex
                  // Payment only moves forward — can't revert once marked.
                  const disabled = isCurrent || isPast
                  return (
                    <button
                      key={status}
                      onClick={() => update({ payment_status: status })}
                      disabled={disabled}
                      className={`text-xs font-medium px-3 py-1 rounded-full border transition
                        ${isCurrent
                          ? paymentColors[status] + ' border-transparent'
                          : isPast
                            ? paymentColors[status] + ' border-transparent opacity-60'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}
                        ${disabled ? 'cursor-not-allowed' : ''}`}
                    >
                      {isPast ? `✓ ${status}` : status}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Order status */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Order Status</p>
            <div className="flex gap-2 flex-wrap">
              {advanceStatuses.map((status, i) => {
                const isCurrent = i === currentIndex
                const isPast = i < currentIndex
                const paymentLocked = requiresPayment.includes(status) && !isPaid
                // Only future steps are clickable — no going back, no skipping past payment.
                const disabled = isCurrent || isPast || paymentLocked
                return (
                  <button
                    key={status}
                    onClick={() => update({ order_status: status })}
                    disabled={disabled}
                    title={paymentLocked ? 'Confirm payment before packing' : ''}
                    className={`text-xs font-medium px-3 py-1 rounded-full border transition
                      ${isCurrent
                        ? statusColors[status] + ' border-transparent'
                        : isPast
                          ? statusColors[status] + ' border-transparent opacity-60'
                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}
                      ${paymentLocked ? 'opacity-40' : ''}
                      ${disabled ? 'cursor-not-allowed' : ''}`}
                  >
                    {isPast ? `✓ ${status}` : status}
                  </button>
                )
              })}
            </div>
            {!isPaid && (
              <p className="text-xs text-gray-400 mt-1">🔒 Confirm payment to pack, ship or deliver.</p>
            )}
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-400 border-t pt-2 mt-1">
        Placed {formatDateTime(order.created_at)} · Updated {formatDateTime(order.updated_at)}
      </p>

      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Close order?</h2>
            <p className="text-sm text-gray-500 mb-5">
              If you close this order, it means the order is complete/cancelled and it will no longer show on the board.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await update({ closed: true })
                  setShowCloseConfirm(false)
                }}
                disabled={updating}
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
