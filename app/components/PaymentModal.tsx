'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { type Order } from '../lib/types'

// Shrink a screenshot to a small JPEG data URL so it fits in a text column
// without needing separate file storage. Fine for a demo; use Supabase
// Storage instead if this ever goes to production.
function fileToSmallDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const maxDim = 800
        let { width, height } = img
        if (width > height && width > maxDim) {
          height = (height * maxDim) / width
          width = maxDim
        } else if (height > maxDim) {
          width = (width * maxDim) / height
          height = maxDim
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Could not process image'))
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.6))
      }
      img.onerror = () => reject(new Error('Could not read image'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

type Step = 'ask' | 'pay' | 'upload' | 'done'

export default function PaymentModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [step, setStep] = useState<Step>('ask')
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null)
  const [proof, setProof] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      setProof(await fileToSmallDataUrl(file))
    } catch {
      setError('Could not read that image. Try another one.')
    }
  }

  async function sendProof() {
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'submitted', payment_proof: proof, updated_at: new Date().toISOString() })
      .eq('id', order.id)
    setSaving(false)
    if (error) setError(error.message)
    else setStep('done')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        {step === 'ask' && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">🎉 Your order is confirmed!</h2>
            <p className="text-sm text-gray-500 mb-4">
              It will be packed once your payment is made.
            </p>
            <p className="text-sm font-medium text-gray-700 mb-2">Have you made the payment?</p>
            <div className="flex flex-col gap-2 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="paid" checked={choice === 'yes'} onChange={() => setChoice('yes')} />
                Yes, I&apos;ve paid
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="paid" checked={choice === 'no'} onChange={() => setChoice('no')} />
                No, not yet
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(choice === 'yes' ? 'upload' : 'pay')}
                disabled={!choice}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                Continue
              </button>
              <button onClick={onClose} className="text-sm text-gray-400 px-3">Later</button>
            </div>
          </>
        )}

        {step === 'pay' && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Please make the payment</h2>
            <p className="text-sm text-gray-500 mb-4">
              Your order will be packed once the payment is made.
            </p>
            <a
              href="#"
              className="block text-center bg-gray-100 hover:bg-gray-200 text-pink-600 text-sm font-semibold py-3 rounded-lg transition mb-4"
            >
              💳 Pay here (payment link)
            </a>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('upload')}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold py-2 rounded-lg transition"
              >
                I&apos;ve paid — send proof
              </button>
              <button onClick={onClose} className="text-sm text-gray-400 px-3">Close</button>
            </div>
          </>
        )}

        {step === 'upload' && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Send payment proof</h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload a screenshot of your payment so the seller can verify it.
            </p>
            <input type="file" accept="image/*" onChange={handleFile} className="text-sm mb-3 w-full" />
            {proof && <img src={proof} alt="payment proof" className="max-h-40 rounded-lg border mb-3" />}
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={sendProof}
                disabled={saving}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Sending...' : proof ? 'Send proof' : 'Send without screenshot'}
              </button>
              <button onClick={onClose} className="text-sm text-gray-400 px-3">Cancel</button>
            </div>
          </>
        )}
        

        {step === 'done' && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-1">✅ Payment proof sent!</h2>
            <p className="text-sm text-gray-500 mb-4">
              Waiting for the seller to verify your payment. This page will update automatically.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold py-2 rounded-lg transition"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  )
}
