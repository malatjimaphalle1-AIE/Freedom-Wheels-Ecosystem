// Idempotent guide seeder
// Reads guide markdown files from data/guides/ and creates Guide records in the database.
// Runs automatically during build (postbuild hook).
// Safe to run multiple times — uses upsert with slug as unique key.

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const db = new PrismaClient()

const GUIDES_DIR = path.join(process.cwd(), 'data', 'guides')

// Guide metadata — maps filename to title, excerpt, category, tags, metaDescription, isMemberOnly, partner names
const GUIDE_META = [
  {
    file: 'guide-15-newsletter-business.md',
    title: 'Building a Newsletter Business from South Africa',
    excerpt: 'Newsletters are the new blogs. Here is how to launch a paid newsletter business from SA.',
    category: 'Business',
    tags: 'newsletter, email marketing, convertkit, content creation, south africa',
    metaDescription: 'Launch a paid newsletter business from South Africa. Complete guide covering ConvertKit, Hostinger, monetization strategies, and step-by-step launch process.',
    isMemberOnly: false,
    partners: ['ConvertKit (Kit)', 'Hostinger', 'Amazon Associates'],
  },
  {
    file: 'guide-16-local-service-digital-makeover.md',
    title: 'The Local Service Business Digital Makeover',
    excerpt: 'Plumbers, electricians, and landscapers: here is how to digitize your local SA service business to get more clients.',
    category: 'Business',
    tags: 'local business, website, digital transformation, south africa, service business',
    metaDescription: 'Digitize your local SA service business. Step-by-step guide to building a website, setting up Google Business Profile, and getting more clients online.',
    isMemberOnly: false,
    partners: ['Hostinger', 'Lulalend'],
  },
  {
    file: 'guide-17-best-laptops-for-coding-2026.md',
    title: 'Best Laptops for Coding & Web Development (2026)',
    excerpt: 'The best machines for SA developers running Docker, Node.js, and VS Code.',
    category: 'Laptops',
    tags: 'laptops, coding, web development, programming, 2026, docker, nodejs',
    metaDescription: 'Best laptops for SA developers in 2026. Reviews of machines that handle Docker, Node.js, VS Code, and heavy development workloads.',
    isMemberOnly: false,
    partners: ['Amazon Associates', 'Hostinger'],
  },
  {
    file: 'guide-18-automate-sa-small-business.md',
    title: 'How to Automate Your SA Small Business',
    excerpt: 'Stop doing manual admin. Here is how to automate your marketing, billing, and design workflows.',
    category: 'Business',
    tags: 'automation, small business, email marketing, canva, workflow, south africa',
    metaDescription: 'Automate your SA small business marketing, billing, and design workflows. Complete guide to ConvertKit, Canva, and business automation tools.',
    isMemberOnly: false,
    partners: ['ConvertKit (Kit)', 'Canva', 'Lulalend'],
  },
  {
    file: 'guide-19-affiliate-marketers-tech-stack.md',
    title: 'The Affiliate Marketer\'s Tech Stack',
    excerpt: 'Want to make money through affiliate marketing in SA? Here is the exact stack to build your first niche site.',
    category: 'Marketing',
    tags: 'affiliate marketing, niche sites, hosting, amazon associates, passive income',
    metaDescription: 'Build your first affiliate marketing niche site in South Africa. Complete tech stack guide covering hosting, domains, Amazon Associates, and content strategy.',
    isMemberOnly: false,
    partners: ['Hostinger', 'Amazon Associates'],
  },
  {
    file: 'guide-20-remote-podcasting-gear.md',
    title: 'Best Gear for Remote Podcasting in South Africa',
    excerpt: 'Start a podcast with remote guests. The best budget microphones and hosting platforms.',
    category: 'Audio',
    tags: 'podcasting, microphones, remote recording, audio gear, south africa',
    metaDescription: 'Best budget podcasting gear for South African creators. Microphones, headphones, and recording tools reviewed with Amazon affiliate links.',
    isMemberOnly: false,
    partners: ['Amazon Associates', 'Hostinger', 'Canva'],
  },
  {
    file: 'guide-21-securing-sa-business.md',
    title: 'Securing Your SA Business: Domains, Hosting, & Trademarks',
    excerpt: 'Protect your digital assets. A guide to securing your business name and website infrastructure.',
    category: 'Business',
    tags: 'security, domains, hosting, trademarks, ssl, business protection, south africa',
    metaDescription: 'Secure your SA business online. Guide to domain registration, hosting security, SSL certificates, trademarks, and protecting your digital assets.',
    isMemberOnly: false,
    partners: ['Hostinger', 'Lulalend'],
  },
  {
    file: 'guide-22-digital-nomad-sa-coffee-shops.md',
    title: 'The Digital Nomad\'s Guide to Working from SA Coffee Shops',
    excerpt: 'Best gear for freelancers who work remotely from coffee shops and co-working spaces.',
    category: 'Remote Work',
    tags: 'digital nomad, remote work, coffee shops, portable chargers, mobile wifi, south africa',
    metaDescription: 'Work remotely from SA coffee shops. Best portable chargers, mobile WiFi hotspots, laptop stands, and noise-cancelling gear for digital nomads.',
    isMemberOnly: false,
    partners: ['Amazon Associates', 'Hostinger', 'Canva'],
  },
  {
    file: 'guide-23-landing-corporate-clients.md',
    title: 'How to Land Corporate Clients as a Freelancer',
    excerpt: 'Corporate clients pay more. Here is the tech and design stack you need to look like a premium agency.',
    category: 'Business',
    tags: 'corporate clients, freelancing, pitch decks, outreach, premium positioning, south africa',
    metaDescription: 'Land corporate clients as a SA freelancer. Build a premium portfolio site, automated outreach sequences, and professional pitch decks.',
    isMemberOnly: true,
    partners: ['ConvertKit (Kit)', 'Canva', 'Hostinger'],
  },
  {
    file: 'guide-24-best-budget-4k-monitors.md',
    title: 'Best Budget 4K Monitors for SA Freelancers',
    excerpt: 'Upgrade your home office with the best budget 4K monitors available on Amazon.',
    category: 'Monitors',
    tags: '4k monitors, budget, home office, display, amazon, south africa',
    metaDescription: 'Best budget 4K monitors for SA freelancers. Reviews of affordable 4K displays with Amazon affiliate links for dual-monitor setups.',
    isMemberOnly: false,
    partners: ['Amazon Associates', 'Hostinger'],
  },
  {
    file: 'guide-25-ecommerce-inventory-funding.md',
    title: 'The SA E-commerce Inventory Funding Playbook',
    excerpt: 'How to finance your Black Friday inventory and design the perfect unboxing experience.',
    category: 'E-commerce',
    tags: 'ecommerce, inventory funding, black friday, unboxing, packaging, lulalend, south africa',
    metaDescription: 'Finance your SA e-commerce inventory with Lulalend. Complete playbook for Black Friday prep, packaging, and unboxing experience design.',
    isMemberOnly: true,
    partners: ['Lulalend', 'Amazon Associates', 'Canva'],
  },
  {
    file: 'guide-26-building-membership-site.md',
    title: 'Building a Membership Site in South Africa',
    excerpt: 'How to build a gated membership community using WordPress and email automation.',
    category: 'Business',
    tags: 'membership site, wordpress, gated content, convertkit, recurring revenue, south africa',
    metaDescription: 'Build a membership site in South Africa. Complete guide to WordPress hosting, email automation, content gating, and subscription pricing models.',
    isMemberOnly: true,
    partners: ['Hostinger', 'ConvertKit (Kit)'],
  },
  {
    file: 'guide-27-ultimate-home-office-under-10k.md',
    title: 'The Ultimate Home Office Setup for Under R10,000',
    excerpt: 'A complete blueprint for building a productivity-boosting home office on a strict budget.',
    category: 'Home Office',
    tags: 'home office, budget, desk, chair, monitor, setup, under 10000, south africa',
    metaDescription: 'Build the ultimate home office for under R10,000. Complete budget breakdown for desk, chair, monitor, lighting, and accessories with Amazon links.',
    isMemberOnly: false,
    partners: ['Amazon Associates', 'Hostinger', 'Canva'],
  },
]

async function main() {
  console.log('[seed-guides] Starting...')

  // Fetch all partners for linking
  const allPartners = await db.affiliatePartner.findMany({ select: { id: true, name: true } })
  const partnerMap = new Map(allPartners.map(p => [p.name, p.id]))

  let created = 0
  let updated = 0

  for (const meta of GUIDE_META) {
    const filePath = path.join(GUIDES_DIR, meta.file)

    let contentMarkdown = ''
    try {
      contentMarkdown = fs.readFileSync(filePath, 'utf-8')
    } catch (err) {
      console.warn(`[seed-guides] ⚠ Could not read ${meta.file}, skipping`)
      continue
    }

    // Generate slug from title
    const slug = meta.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)

    const now = new Date()

    // Upsert the guide
    const existing = await db.guide.findUnique({ where: { slug } })

    if (existing) {
      // Update content only (don't change published status if already set)
      await db.guide.update({
        where: { id: existing.id },
        data: {
          title: meta.title,
          excerpt: meta.excerpt,
          contentMarkdown,
          category: meta.category,
          tags: meta.tags,
          metaDescription: meta.metaDescription,
          isMemberOnly: meta.isMemberOnly,
        },
      })

      // Update partner links
      await db.guidePartnerLink.deleteMany({ where: { guideId: existing.id } })
      for (const partnerName of meta.partners) {
        const partnerId = partnerMap.get(partnerName)
        if (partnerId) {
          await db.guidePartnerLink.upsert({
            where: { guideId_partnerId: { guideId: existing.id, partnerId } },
            create: { guideId: existing.id, partnerId },
            update: {},
          })
        }
      }

      updated++
      console.log(`[seed-guides] ✓ Updated: ${meta.title}`)
    } else {
      // Create new guide
      const guide = await db.guide.create({
        data: {
          slug,
          title: meta.title,
          excerpt: meta.excerpt,
          contentMarkdown,
          category: meta.category,
          tags: meta.tags,
          metaDescription: meta.metaDescription,
          isMemberOnly: meta.isMemberOnly,
          isPublished: true,
          publishedAt: now,
        },
      })

      // Link partners
      for (const partnerName of meta.partners) {
        const partnerId = partnerMap.get(partnerName)
        if (partnerId) {
          await db.guidePartnerLink.create({
            data: { guideId: guide.id, partnerId },
          }).catch(() => {}) // ignore duplicate errors
        }
      }

      created++
      console.log(`[seed-guides] ✓ Created: ${meta.title}`)
    }
  }

  const total = await db.guide.count({ where: { isPublished: true } })
  console.log(`[seed-guides] Done. ${created} created, ${updated} updated. ${total} published guides total.`)
}

main()
  .catch((err) => {
    console.error('[seed-guides] FATAL:', err)
    process.exit(0) // don't fail the build
  })
  .finally(async () => {
    await db.$disconnect()
  })
