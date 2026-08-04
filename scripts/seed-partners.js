// Idempotent affiliate partner seeder
// Runs automatically during build (postbuild hook) to ensure all production
// deploys have the correct partner list.
//
// Safe to run multiple times — uses upsert.

const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

const PARTNERS = [
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
  {
    name: 'Lulalend',
    url: 'https://www.lulalend.co.za',
    affiliateUrl: 'https://www.lulalend.co.za/?a=sGfGBtmv',
    commissionRate: 'Commission on successful referrals',
    category: 'Business Funding',
    description: 'Fast and flexible business funding for SA SMEs and sole traders that traditional lenders often can\'t serve. Help your clients secure funding and grow their businesses.',
    displayOrder: 60,
  },
]

async function main() {
  console.log('[seed-partners] Starting...')

  for (const p of PARTNERS) {
    await db.affiliatePartner.upsert({
      where: { name: p.name },
      create: p,
      update: p,
    })
    console.log(`[seed-partners] ✓ ${p.name}`)
  }

  const count = await db.affiliatePartner.count()
  console.log(`[seed-partners] Done. ${count} partners in DB.`)
}

main()
  .catch((err) => {
    console.error('[seed-partners] FATAL:', err)
    // Don't exit with error code — that would fail the build.
    // Just log and continue. The app will still work without partners seeded
    // (they can be added later via the admin UI).
    process.exit(0)
  })
  .finally(async () => {
    await db.$disconnect()
  })
