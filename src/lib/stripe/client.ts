import Stripe from 'stripe'

// Lazy singleton — constructing eagerly at module scope makes Next's build-time
// page-data collection instantiate this route even when STRIPE_SECRET_KEY isn't
// set in that environment (e.g. a local/CI build without prod secrets),
// crashing the whole build instead of just this route at request time.
let instance: Stripe | null = null

export function getStripe(): Stripe {
  if (!instance) instance = new Stripe(process.env.STRIPE_SECRET_KEY!)
  return instance
}
