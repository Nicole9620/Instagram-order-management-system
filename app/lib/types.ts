// Shared shape of a row in the Supabase `orders` table.
export type Order = {
  id: string
  customer_name: string
  item_name: string
  variant: string | null
  price: number | null
  address: string | null
  payment_status: string
  payment_proof: string | null
  order_status: string
  created_at: string
  updated_at: string | null
}

// The order a request moves through, in sequence.
export const STATUS_FLOW = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'] as const
