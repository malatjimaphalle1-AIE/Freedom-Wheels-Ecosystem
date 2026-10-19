// Seeds "The Budget Launch" digital product with 3 pricing tiers
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

const PRODUCTS = [
  {
    slug: 'budget-launch-intro',
    title: 'The Budget Launch — Intro Edition',
    subtitle: 'How to Plan Your First Online Business in One Weekend — With a Budget of R1,000 or Less',
    description: 'A practical 32-page guide for South African entrepreneurs who want to start small, make informed decisions, and test an idea without unnecessary complexity. Includes 6 printable worksheets, a weekend launch schedule, and a 7-day action tracker.',
    longDescription: 'Turn your business idea into a practical launch plan in one weekend. Learn how to choose an online business model, define your first offer, estimate startup costs, and plan your first customer outreach — without committing to an expensive website or paid subscriptions.',
    coverImageUrl: null,
    pdfUrl: null, // Set this to the actual PDF URL after creating the PDF
    bonusUrl: null,
    priceCents: 9900, // R99
    compareAtCents: 14900, // R149 (show as "was R149")
    tier: 'intro',
    isPublished: true,
    isFeatured: false,
    features: '32-page step-by-step guide,Business idea scorecard,Customer problem discovery template,One-page offer builder,R1,000 startup budget worksheet,First-customer outreach scripts,Seven-day action tracker,Weekend launch schedule (Saturday + Sunday)',
    displayOrder: 100,
  },
  {
    slug: 'budget-launch-standard',
    title: 'The Budget Launch — Standard Edition',
    subtitle: 'The complete guide + worksheets + sales page template',
    description: 'Everything in the Intro Edition, plus a sales page copy template, email outreach scripts, and a financial projections tracker. For entrepreneurs who are ready to launch and want the complete toolkit.',
    longDescription: 'The Standard Edition includes the full 32-page guide, all 6 worksheets, PLUS a sales page copy template, email outreach sequence, and a monthly revenue/expense tracker template.',
    coverImageUrl: null,
    pdfUrl: null,
    bonusUrl: null,
    priceCents: 14900, // R149
    compareAtCents: null,
    tier: 'standard',
    isPublished: true,
    isFeatured: true, // Featured (recommended)
    features: 'Everything in Intro Edition,Sales page copy template (fill-in-the-blanks),5-email customer outreach sequence,Monthly revenue & expense tracker template,Customer persona template,Competitor analysis matrix',
    displayOrder: 200,
  },
  {
    slug: 'budget-launch-bundle',
    title: 'The Budget Launch — Complete Bundle',
    subtitle: 'Guide + worksheets + 8 expanded templates + 30-day content calendar',
    description: 'The complete Budget Launch system. Includes the 32-page guide, all 6 worksheets, PLUS 8 advanced templates: customer persona builder, competitor matrix, sales page formula, 5-email sequence, 30-day social media calendar, financial projections, partnership outreach script, and a price testing framework.',
    longDescription: 'The Complete Bundle is for entrepreneurs who want the full toolkit. You get the 32-page guide, all 6 worksheets, AND 8 expanded templates that cover everything from customer personas to price testing.',
    coverImageUrl: null,
    pdfUrl: null,
    bonusUrl: null, // Set to expanded templates URL after creating
    priceCents: 19900, // R199
    compareAtCents: 29900, // R299 (show as "was R299")
    tier: 'bundle',
    isPublished: true,
    isFeatured: false,
    features: 'Everything in Standard Edition,Advanced customer persona template (demographics + psychographics),Competitor analysis matrix (5-competitor comparison),Sales page copy template (15-section formula),5-email welcome sequence template,30-day social media content calendar,Financial projections spreadsheet template,Partnership outreach script,Price testing framework (A/B testing guide)',
    displayOrder: 300,
  },
]

async function main() {
  console.log('[seed-digital-products] Starting...')

  for (const product of PRODUCTS) {
    const existing = await db.digitalProduct.findUnique({ where: { slug: product.slug } })
    if (existing) {
      await db.digitalProduct.update({ where: { id: existing.id }, data: product })
      console.log(`[seed-digital-products] ✓ Updated: ${product.title}`)
    } else {
      await db.digitalProduct.create({ data: product })
      console.log(`[seed-digital-products] ✓ Created: ${product.title}`)
    }
  }

  const total = await db.digitalProduct.count()
  console.log(`[seed-digital-products] Done. ${total} products total.`)
}

main()
  .catch((err) => { console.error('[seed-digital-products] FATAL:', err); process.exit(0) })
  .finally(async () => { await db.$disconnect() })
