// Freedom Wheels — affiliate partner seed data
// These are the real external affiliate programs FWE participates in.
// Adding a partner here automatically displays it on the public landing page.

import { db } from '@/lib/db'

export async function seedAffiliatePartners() {
  const partners = [
    {
      name: 'Amazon Associates',
      url: 'https://www.amazon.com',
      affiliateUrl: 'https://www.amazon.com?tag=freedomwheels-20',
      commissionRate: '1–10%',
      category: 'Retail',
      description: 'Earn commissions on products we recommend in our buying guides — books, electronics, home-office equipment, and learning resources.',
      displayOrder: 10,
    },
    {
      name: 'Hostinger',
      url: 'https://www.hostinger.com',
      affiliateUrl: 'https://hostinger.com/affiliates?ref=freedomwheels',
      commissionRate: '60%+ of first sale',
      category: 'Hosting',
      description: 'Web hosting and domains for South African entrepreneurs. The most popular budget hosting option in SA.',
      displayOrder: 20,
    },
    {
      name: 'Namecheap',
      url: 'https://www.namecheap.com',
      affiliateUrl: 'https://www.namecheap.com/affiliates?ref=freedomwheels',
      commissionRate: '20–35%',
      category: 'Domains',
      description: 'Domain registration, SSL certificates, and email hosting. Recurring commissions on renewals.',
      displayOrder: 30,
    },
    {
      name: 'Canva',
      url: 'https://www.canva.com',
      affiliateUrl: 'https://www.canva.com/affiliates?ref=freedomwheels',
      commissionRate: '$36 per Pro signup',
      category: 'Design',
      description: 'Design software used by virtually every freelancer. High conversion rate among FWE members.',
      displayOrder: 40,
    },
    {
      name: 'ConvertKit (Kit)',
      url: 'https://convertkit.com',
      affiliateUrl: 'https://convertkit.com/affiliates?ref=freedomwheels',
      commissionRate: '50% recurring (12 months)',
      category: 'Email Marketing',
      description: 'Email marketing platform for creators. Recurring commissions create predictable monthly revenue.',
      displayOrder: 50,
    },
  ]

  for (const p of partners) {
    await db.affiliatePartner.upsert({
      where: { name: p.name },
      create: p,
      update: p,
    })
  }
}
