import { getStripe } from './client'

export interface CompanyDetails {
  name: string
  line1: string
  city: string
  postalCode: string
  nip: string
}

const EMPTY: CompanyDetails = { name: '', line1: '', city: '', postalCode: '', nip: '' }

export async function getCompanyDetails(stripeCustomerId: string): Promise<CompanyDetails> {
  const stripe = getStripe()
  const details = { ...EMPTY }
  try {
    const customer = await stripe.customers.retrieve(stripeCustomerId)
    if (!customer.deleted) {
      details.name = customer.name ?? ''
      details.line1 = customer.address?.line1 ?? ''
      details.city = customer.address?.city ?? ''
      details.postalCode = customer.address?.postal_code ?? ''
    }
    const taxIds = await stripe.customers.listTaxIds(stripeCustomerId, { limit: 5 })
    const vat = taxIds.data.find(t => t.type === 'eu_vat')
    details.nip = vat?.value.replace(/^PL/i, '') ?? ''
  } catch {
    // Billing account exists but company details aren't set yet.
  }
  return details
}
