'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen,
  Search,
  Play,
  FileText,
  Video,
  GraduationCap,
  Clock,
  Star,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Zap,
  CheckCircle2,
  AlertCircle,
  Target,
  Rocket,
  Shield,
  Brain,
  TrendingUp,
  Users,
  Wallet,
  Globe,
  Share2,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  CheckCircle,
  List,
  X,
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { useEngineBus } from '@/lib/engine-bus'

// ─── Types ──────────────────────────────────────────────────────────────

interface ArticleSection {
  id: string
  title: string
  content: string
}

interface Article {
  id: string
  title: string
  category: string
  readTime: string
  featured: boolean
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  icon: typeof BookOpen
  description: string
  sections: ArticleSection[]
  keyTakeaways: string[]
  relatedArticles: string[]
  lastUpdated: string
}

interface VideoTutorial {
  id: string
  title: string
  duration: string
  views: string
  category: string
  description: string
  chapters: { time: string; title: string }[]
}

// ─── Category Definitions ───────────────────────────────────────────────

const categories = [
  { id: 'All', label: 'All', icon: Layers },
  { id: 'Getting Started', label: 'Getting Started', icon: Rocket },
  { id: 'Engines', label: 'Engines', icon: Cpu },
  { id: 'Leads', label: 'Leads', icon: Users },
  { id: 'Wallet', label: 'Wallet', icon: Wallet },
  { id: 'Traffic', label: 'Traffic', icon: Globe },
  { id: 'Automation', label: 'Automation', icon: Zap },
  { id: 'AI', label: 'AI & Intelligence', icon: Brain },
  { id: 'Security', label: 'Security', icon: Shield },
  { id: 'Growth', label: 'Growth', icon: TrendingUp },
]

// ─── Full Article Data ──────────────────────────────────────────────────

const articles: Article[] = [
  {
    id: 'a1',
    title: 'Building Your First Income Engine',
    category: 'Engines',
    readTime: '5 min',
    featured: true,
    difficulty: 'Beginner',
    icon: Cpu,
    description: 'Step-by-step guide to deploying your first autonomous income engine in the Freedom Wheels ecosystem.',
    lastUpdated: '2025-03-15',
    sections: [
      {
        id: 's1-1',
        title: 'What is an Income Engine?',
        content: `An Income Engine is an autonomous system that generates revenue without requiring your constant attention. Think of it as a self-operating business unit that runs 24/7, powered by AI and automation.

In the Freedom Wheels ecosystem, engines are composed of interconnected nodes — input sources, processing modules, and output channels. Each node performs a specific function, and together they form a pipeline that transforms raw inputs (traffic, data, leads) into measurable outputs (revenue, signups, conversions).

The key principle is: **Build once, earn repeatedly.** Unlike freelance work or hourly jobs, an income engine continues producing value long after you've set it up.`,
      },
      {
        id: 's1-2',
        title: 'Choosing Your Engine Type',
        content: `Freedom Wheels offers several engine templates to get you started:

**1. Content Syndicator** — Automatically generates and distributes content across platforms. Best for creators and educators.

**2. Lead Magnet Funnel** — Captures visitor information and nurtures leads through automated email sequences. Best for service providers.

**3. Crypto Arbitrage Bot** — Monitors price differences across exchanges and executes profitable trades. Best for those comfortable with cryptocurrency markets.

**4. Affiliate Engine** — Promotes products through curated recommendations and earns commissions. Best for influencers and bloggers.

For your first engine, we recommend the **Content Syndicator** — it's the easiest to set up and provides clear, visible results within days.`,
      },
      {
        id: 's1-3',
        title: 'Step-by-Step Setup',
        content: `Follow these steps to deploy your first engine:

**Step 1:** Navigate to the **Engine Builder** in the sidebar.

**Step 2:** Click **"New Engine"** and select the **Content Syndicator** template.

**Step 3:** Configure your input sources:
- Add RSS feeds from industry publications
- Connect your social media accounts
- Set up keyword monitors for trending topics

**Step 4:** Customize the AI processing:
- Choose your content voice (Professional, Casual, Technical)
- Set posting frequency (we recommend 3-5 posts/day to start)
- Define your target audience parameters

**Step 5:** Set your output channels:
- Blog (auto-publish to your site)
- Social media (Twitter, LinkedIn, Facebook)
- Email newsletter (weekly digest)

**Step 6:** Click **"Deploy Engine"** and watch it come alive in the Live Engines dashboard!

Your engine will start in "STARTING" status and transition to "ACTIVE" within 2-3 minutes as it begins processing data.`,
      },
      {
        id: 's1-4',
        title: 'Monitoring & Optimization',
        content: `Once your engine is running, use these dashboards to track performance:

- **Live Engines** — Real-time telemetry showing throughput, revenue, and health
- **Lead Intelligence** — Track how your content converts visitors into leads
- **Wallet** — Monitor revenue flowing into your multi-asset wallet

**Key metrics to watch:**
- **Throughput (RPM):** Requests per minute — higher is better
- **Health:** Keep this above 90% for optimal performance
- **Latency:** Lower is better — under 100ms is ideal

If health drops below 80%, the engine will show a warning. You can pause and restart engines at any time from the Live Engines control panel.`,
      },
    ],
    keyTakeaways: [
      'Income engines are autonomous systems that generate revenue 24/7',
      'Start with the Content Syndicator template for easiest setup',
      'Configure inputs → AI processing → outputs in the Engine Builder',
      'Monitor health, throughput, and latency in the Live Engines dashboard',
      'Engines can be paused, stopped, or restarted at any time',
    ],
    relatedArticles: ['a2', 'a6', 'a7'],
  },
  {
    id: 'a2',
    title: 'Lead Scoring: The Complete Guide',
    category: 'Leads',
    readTime: '8 min',
    featured: true,
    difficulty: 'Intermediate',
    icon: Target,
    description: 'Master the art and science of lead scoring to prioritize your hottest prospects and close more deals.',
    lastUpdated: '2025-03-12',
    sections: [
      {
        id: 's2-1',
        title: 'What is Lead Scoring?',
        content: `Lead scoring is a methodology used to rank prospects against a scale that represents the perceived value each lead represents to your organization. In Freedom Wheels, lead scoring is powered by AI and happens automatically.

Every lead in your pipeline receives a score from 0-100 based on multiple factors:
- **Engagement level** — How actively they interact with your content
- **Budget indicators** — Signals that suggest purchasing capacity
- **Decision-making authority** — Whether they can make buying decisions
- **Timeline urgency** — How quickly they need a solution
- **Fit score** — How well they match your ideal customer profile

Leads are automatically categorized as **Hot** (80-100), **Warm** (50-79), or **Cold** (0-49).`,
      },
      {
        id: 's2-2',
        title: 'The AI Scoring Model',
        content: `Freedom Wheels uses a multi-factor AI model that continuously refines scores based on real behavior:

**Behavioral Signals (40% weight):**
- Email open and click rates
- Website visit frequency and depth
- Content download activity
- Social media engagement
- Webinar attendance

**Demographic Signals (30% weight):**
- Job title and seniority
- Company size and industry
- Geographic location
- Technology stack

**Intent Signals (20% weight):**
- Search queries related to your offerings
- Competitor comparison activity
- Pricing page visits
- Demo request behavior

**Engagement Recency (10% weight):**
- Time since last interaction
- Interaction velocity (accelerating vs. decelerating)
- Response time to outreach

The AI model re-scores leads every 6 hours, so you always have up-to-date intelligence.`,
      },
      {
        id: 's2-3',
        title: 'Working with Scored Leads',
        content: `Navigate to **Lead Intelligence** in the sidebar to work with your scored leads:

**For Hot Leads (80-100):**
- Prioritize immediate outreach
- Use personalized messaging referencing their specific interests
- Offer demos or trial extensions
- Assign to senior sales team members

**For Warm Leads (50-79):**
- Nurture with targeted content sequences
- Schedule follow-up calls within 48 hours
- Share case studies relevant to their industry
- Monitor for score increases

**For Cold Leads (0-49):**
- Add to long-term nurture campaigns
- Share educational content to build awareness
- Re-engage with new content announcements
- Don't invest heavy resources until score improves

**Pro Tip:** Click on any lead in the Lead Intelligence view to see their complete interaction history and individual scoring factors.`,
      },
    ],
    keyTakeaways: [
      'Lead scores range from 0-100 with Hot/Warm/Cold categories',
      'AI re-scores leads every 6 hours based on 4 signal categories',
      'Hot leads should get immediate personalized outreach',
      'Warm leads need nurturing with targeted content',
      'Cold leads go into long-term automated campaigns',
    ],
    relatedArticles: ['a1', 'a5', 'a8'],
  },
  {
    id: 'a3',
    title: 'Multi-Asset Wallet Configuration',
    category: 'Wallet',
    readTime: '4 min',
    featured: false,
    difficulty: 'Beginner',
    icon: Wallet,
    description: 'Configure your multi-currency, multi-asset wallet to manage fiat, crypto, and digital earnings in one place.',
    lastUpdated: '2025-03-10',
    sections: [
      {
        id: 's3-1',
        title: 'Understanding Your Wallet',
        content: `The Freedom Wheels Wallet is a multi-asset financial hub that consolidates all your earnings across different currencies and asset types:

**Fiat Currencies:**
- USD (US Dollar) — Primary settlement currency
- EUR (Euro) — European market earnings
- GBP (British Pound) — UK market earnings
- ZAR (South African Rand) — African market earnings

**Cryptocurrencies:**
- USDT (Tether) — Stablecoin for crypto settlements
- BTC (Bitcoin) — Long-term value storage
- ETH (Ethereum) — Smart contract earnings
- SOL (Solana) — Fast transaction settlements

All earnings from your engines flow into this wallet automatically. The wallet supports instant conversion between supported currencies at market rates.`,
      },
      {
        id: 's3-2',
        title: 'Withdrawal Process',
        content: `To withdraw funds from your wallet:

**Step 1:** Go to the **Wallet** view and click the **Withdraw** button.

**Step 2:** Select your withdrawal destination:
- Wise account (USD, EUR, GBP, ZAR)
- Crypto wallet (BTC, ETH, SOL, USDT)
- Bank transfer (selected regions)

**Step 3:** Enter the amount and confirm. Withdrawals are processed as follows:
- **Wise:** 1-2 business days
- **Crypto:** 10-30 minutes (network dependent)
- **Bank:** 3-5 business days

**Minimum withdrawal amounts:**
- Fiat: $50.00
- Crypto: Equivalent of $25.00

**Important:** Withdrawal requests can be cancelled within 5 minutes for a full refund. After that, the transaction enters processing and cannot be reversed.`,
      },
      {
        id: 's3-3',
        title: 'Transaction History & Taxes',
        content: `Your wallet maintains a complete transaction history including:
- Engine revenue deposits
- Marketplace purchases
- Referral bonuses
- Withdrawal records
- Currency conversions

**Transaction Filtering:**
Use the filter options in the Wallet view to sort by:
- Date range
- Transaction type (credit/debit)
- Amount range
- Currency

**Tax Reporting:**
At the end of each quarter, you can export a tax summary report from Settings → Tax Reports. The report includes:
- Total revenue by source
- Withdrawal totals
- Currency conversion gains/losses
- Referral income breakdown

**Pro Tip:** Enable two-factor authentication in Settings for maximum wallet security. This is mandatory for withdrawals exceeding $1,000.`,
      },
    ],
    keyTakeaways: [
      'Multi-asset wallet supports fiat (USD, EUR, GBP, ZAR) and crypto (BTC, ETH, SOL, USDT)',
      'Engine earnings flow into the wallet automatically',
      'Withdrawals to Wise take 1-2 days, crypto takes 10-30 minutes',
      'Minimum withdrawal: $50 fiat, $25 crypto equivalent',
      'Export quarterly tax reports from Settings',
    ],
    relatedArticles: ['a1', 'a4', 'a6'],
  },
  {
    id: 'a4',
    title: 'AI Content Generation Best Practices',
    category: 'Traffic',
    readTime: '6 min',
    featured: false,
    difficulty: 'Intermediate',
    icon: Brain,
    description: 'Learn how to leverage AI-powered content generation to drive traffic and build your audience at scale.',
    lastUpdated: '2025-03-14',
    sections: [
      {
        id: 's4-1',
        title: 'The AI Content Pipeline',
        content: `Freedom Wheels uses a multi-stage AI pipeline to generate high-quality content:

**Stage 1: Research** — The AI scans RSS feeds, social media trending topics, and search patterns to identify content opportunities with high traffic potential.

**Stage 2: Outline Generation** — Based on research, the AI creates a structured outline with key sections, talking points, and SEO keywords.

**Stage 3: Draft Writing** — The AI produces a complete draft following your configured voice, tone, and style guidelines.

**Stage 4: Optimization** — The draft is optimized for:
- SEO (keyword density, meta descriptions, headers)
- Readability (Flesch score, sentence length)
- Engagement (hook strength, call-to-action placement)

**Stage 5: Distribution** — Content is automatically published to your configured channels with optimized posting times.

The entire pipeline runs in under 60 seconds for a standard blog post.`,
      },
      {
        id: 's4-2',
        title: 'Optimizing Content Quality',
        content: `To get the best results from AI content generation:

**Voice Configuration:**
- **Professional:** Formal language, industry jargon, data-driven arguments
- **Casual:** Conversational tone, relatable examples, storytelling approach
- **Technical:** Deep technical detail, code examples, architecture discussions

Match your voice to your audience. If unsure, start with Casual — it has the broadest appeal.

**Content Calendar Strategy:**
- Post 3-5 times per week for blog content
- Share 2-3 social posts per day
- Send weekly newsletter digest
- Create 1 deep-dive (2000+ word) article per month

**SEO Best Practices:**
- Include target keyword in title and first paragraph
- Use H2 and H3 headers for structure
- Add internal links to your other content
- Include a clear call-to-action
- Keep paragraphs under 4 sentences for readability

**Pro Tip:** The AI learns from your audience's engagement patterns. The more content you publish, the better it gets at predicting what resonates.`,
      },
    ],
    keyTakeaways: [
      'AI pipeline: Research → Outline → Draft → Optimize → Distribute in under 60 seconds',
      'Choose voice (Professional/Casual/Technical) based on target audience',
      'Post 3-5 blog posts/week and 2-3 social posts/day for optimal growth',
      'Include keywords in titles, use headers, and add calls-to-action',
      'AI improves over time by learning from engagement patterns',
    ],
    relatedArticles: ['a1', 'a7', 'a9'],
  },
  {
    id: 'a5',
    title: 'Automation Workflow Patterns',
    category: 'Automation',
    readTime: '7 min',
    featured: false,
    difficulty: 'Advanced',
    icon: Zap,
    description: 'Design powerful automation workflows that chain engines together for compound income generation.',
    lastUpdated: '2025-03-08',
    sections: [
      {
        id: 's5-1',
        title: 'Workflow Design Principles',
        content: `Automation workflows connect multiple engines into compound income systems. Here are the core design principles:

**1. Input Diversity** — Never rely on a single input source. Chain multiple content sources into your processing nodes to ensure continuous operation even if one source fails.

**2. Fail-Safe Routing** — Design your workflows with fallback paths. If a primary output channel fails (e.g., social media API downtime), content should route to backup channels automatically.

**3. Revenue Multiplication** — Every output should generate at least two forms of value:
- Direct revenue (sales, commissions)
- Indirect value (leads, data, brand awareness)

**4. Feedback Loops** — Connect your output metrics back to your input processing. If a certain content type generates high revenue, the system should produce more of it automatically.

**5. Human Checkpoints** — For high-stakes decisions (large trades, expensive ad spend), insert human approval nodes into the workflow.`,
      },
      {
        id: 's5-2',
        title: 'Proven Workflow Templates',
        content: `Here are the top 3 proven automation workflows:

**The Content Flywheel:**
\`\`\`
RSS Feeds → AI Rewriter → Blog Post → Social Distribution → Traffic → Lead Capture → Email Sequence → Revenue
     ↑                                                                                              |
     └──────────────── Performance Feedback ────────────────────────────────────────────────────────┘
\`\`\`

**The Lead Conversion Engine:**
\`\`\`
Social Ads → Landing Page → Lead Magnet → Score & Qualify → Hot Lead → Sales Call → Close → Revenue
     ↑                                                                              |
     └─────────────── Retarget Non-Converters ──────────────────────────────────────┘
\`\`\`

**The Arbitrage Pipeline:**
\`\`\`
Market Data → Spread Detection → Risk Assessment → Trade Execution → Wallet Deposit → Portfolio Rebalance
     ↑                                                                                  |
     └────────────── Performance Metrics ───────────────────────────────────────────────┘
\`\`\`

All three workflows are available as templates in the Engine Builder.`,
      },
    ],
    keyTakeaways: [
      'Chain multiple engines into compound income systems',
      'Use input diversity, fail-safe routing, and revenue multiplication',
      'Feedback loops allow engines to self-optimize over time',
      '3 proven templates: Content Flywheel, Lead Conversion, Arbitrage Pipeline',
      'Insert human checkpoints for high-stakes automated decisions',
    ],
    relatedArticles: ['a1', 'a7', 'a8'],
  },
  {
    id: 'a6',
    title: 'Quick Start: From Zero to First Revenue',
    category: 'Getting Started',
    readTime: '3 min',
    featured: true,
    difficulty: 'Beginner',
    icon: Rocket,
    description: 'Get up and running with Freedom Wheels in under 10 minutes and start earning your first sovereign income.',
    lastUpdated: '2025-03-16',
    sections: [
      {
        id: 's6-1',
        title: 'Your First 10 Minutes',
        content: `Welcome to Freedom Wheels! Here's your rapid onboarding path:

**Minute 0-2: Create Your Account**
- Sign up with your email or Google account
- Complete your profile (display name, timezone)
- You'll be placed on the FREE plan with access to core features

**Minute 2-5: Explore the Dashboard**
- The **Command Center** shows your revenue overview, charts, and active engines
- The **Live Engines** view shows real-time telemetry of all running engines
- Check the **Wallet** to see your starting balance and transaction history

**Minute 5-8: Deploy Your First Engine**
- Go to **Engine Builder** → Click **"New Engine"**
- Select the **"Content Syndicator"** quick-start template
- Connect at least one social media account
- Click **"Deploy"** and watch it start in Live Engines

**Minute 8-10: Monitor & Learn**
- Watch your engine's throughput in the Live Engines dashboard
- Check Lead Intelligence for any early leads
- Bookmark this Knowledge Base for deeper learning

**What happens next?**
Within 24-48 hours, your Content Syndicator will start generating traffic. Within 3-7 days, you should see your first leads. Revenue typically follows within 2-4 weeks for new accounts.`,
      },
      {
        id: 's6-2',
        title: 'Upgrading Your Plan',
        content: `Freedom Wheels offers several plans to scale your sovereign income:

**FREE Plan:**
- 1 engine (Content Syndicator only)
- Basic analytics
- Wallet with limited withdrawal options
- Community support

**STARTER Plan ($29/month):**
- 3 engines of any type
- Lead Intelligence with basic scoring
- Full wallet access
- Email support

**PRO Plan ($99/month):**
- Unlimited engines
- Advanced Lead Intelligence with AI scoring
- Priority withdrawals (same-day processing)
- AI Assistant access
- Priority support

**SOVEREIGN Plan ($299/month):**
- Everything in PRO
- Custom engine templates
- Dedicated account manager
- API access for custom integrations
- White-label options
- Tax reporting and compliance tools

Upgrade anytime from **Settings → Subscription**. All plans include a 14-day free trial of PRO features.`,
      },
    ],
    keyTakeaways: [
      'Create account → Explore dashboard → Deploy engine → Monitor — all in 10 minutes',
      'Content Syndicator is the recommended first engine for new users',
      'Expect traffic within 24-48 hours, leads in 3-7 days, revenue in 2-4 weeks',
      'FREE plan includes 1 engine; PRO unlocks unlimited engines + AI features',
      'All paid plans include a 14-day free trial of PRO features',
    ],
    relatedArticles: ['a1', 'a3', 'a10'],
  },
  {
    id: 'a7',
    title: 'Advanced Engine Node Configuration',
    category: 'Engines',
    readTime: '10 min',
    featured: false,
    difficulty: 'Advanced',
    icon: Cpu,
    description: 'Deep dive into custom engine node types, conditional routing, and advanced processing patterns.',
    lastUpdated: '2025-03-05',
    sections: [
      {
        id: 's7-1',
        title: 'Node Types Reference',
        content: `Every engine is built from nodes. Here's the complete reference:

**Input Nodes:**
- **RSS Feed** — Monitors and ingests content from RSS/Atom feeds
- **Webhook** — Receives data via HTTP POST requests
- **Schedule** — Triggers on a cron schedule (e.g., every hour)
- **File Watch** — Monitors cloud storage for new files
- **Social Listen** — Monitors social media for keywords/mentions

**Processing Nodes:**
- **AI Rewrite** — Rewrites content using AI with configurable voice/tone
- **Filter** — Applies conditional logic (if/then/else branching)
- **Aggregate** — Combines multiple inputs into a single stream
- **Transform** — Maps and reshapes data fields
- **Score** — Applies lead scoring or content quality scoring
- **Delay** — Adds a time delay (for drip sequences)

**Output Nodes:**
- **Blog Post** — Publishes to your connected blog
- **Social Post** — Posts to social media channels
- **Email Send** — Sends via your email service provider
- **Webhook Out** — Sends data to an external API
- **Database Write** — Stores data in your connected database
- **Notification** — Sends an in-app or push notification`,
      },
      {
        id: 's7-2',
        title: 'Conditional Routing',
        content: `Use Filter nodes to create conditional paths in your engine:

**Example: Lead Priority Router**
\`\`\`
Lead Input → Score Node → Filter (score > 80?) 
                              ├─ Yes → Hot Lead Sequence (immediate outreach)
                              └─ No → Filter (score > 50?)
                                        ├─ Yes → Warm Lead Nurture (3-email sequence)
                                        └─ No → Cold Lead Archive (monthly digest only)
\`\`\`

**Example: Content Quality Gate**
\`\`\`
AI Draft → Quality Score → Filter (score > 85?)
                              ├─ Yes → Auto-Publish to Blog + Social
                              └─ No → Filter (score > 60?)
                                        ├─ Yes → Send for Human Review
                                        └─ No → Discard & Regenerate
\`\`\`

Conditional routing ensures only high-quality outputs reach your audience while lower-quality content gets filtered for improvement.`,
      },
    ],
    keyTakeaways: [
      'Input nodes gather data, Processing nodes transform it, Output nodes deliver results',
      'Filter nodes enable conditional if/then/else branching',
      'Use quality gates to auto-publish high-scoring content',
      'Score-based routing ensures leads get appropriate follow-up',
      'Delay nodes enable drip sequence timing control',
    ],
    relatedArticles: ['a1', 'a5', 'a9'],
  },
  {
    id: 'a8',
    title: 'Referral Network Growth Strategy',
    category: 'Growth',
    readTime: '5 min',
    featured: false,
    difficulty: 'Intermediate',
    icon: Share2,
    description: 'Build a thriving referral network that generates passive income through the Freedom Wheels referral program.',
    lastUpdated: '2025-03-11',
    sections: [
      {
        id: 's8-1',
        title: 'How Referrals Work',
        content: `The Freedom Wheels referral program rewards you for bringing new users to the ecosystem:

**Referral Rewards:**
- When a referred user signs up for FREE: **$5 credit** to your wallet
- When a referred user upgrades to STARTER: **$25 bonus**
- When a referred user upgrades to PRO: **$75 bonus**
- When a referred user upgrades to SOVEREIGN: **$200 bonus**

**Lifetime Value:**
You also earn **5% of all engine revenue** generated by your direct referrals for the first 12 months. This creates a powerful passive income stream that grows as your referral network expands.

**Referral Tracking:**
- Each user gets a unique referral code (e.g., FW-MLATJI-2025)
- Track signups, upgrades, and earnings in the **Referrals** dashboard
- Real-time notifications when a referral takes action
- Monthly referral performance reports`,
      },
      {
        id: 's8-2',
        title: 'Growth Strategies',
        content: `**Strategy 1: Content-Driven Referrals**
Create valuable content (blog posts, videos, social threads) about your Freedom Wheels experience. Include your referral link naturally within the content. This is the most sustainable approach.

**Strategy 2: Community Building**
Join and contribute to entrepreneur communities, side-hustle forums, and passive income groups. Share your genuine results and offer to help newcomers get started with your referral code.

**Strategy 3: The Demo Approach**
Offer to walk people through the platform live. Screen-share your dashboard, show your engines running, and let them see real results. This converts at 3-5x higher than passive link sharing.

**Strategy 4: Team Challenges**
Organize referral challenges within your network. Set goals (e.g., "First person to refer 10 PRO users gets a bonus from me"). This creates friendly competition and multiplies your reach.

**Strategy 5: Complementary Partnerships**
Partner with course creators, coaches, and consultants whose audiences would benefit from Freedom Wheels. Offer them a referral code and co-create content together.

**Pro Tip:** The most successful referrers focus on helping, not selling. Share knowledge, offer support, and the referrals will follow naturally.`,
      },
    ],
    keyTakeaways: [
      'Earn $5-$200 per referral signup depending on plan level',
      '5% revenue share from referral earnings for 12 months',
      'Content-driven referrals are the most sustainable growth strategy',
      'Live demos convert 3-5x better than passive link sharing',
      'Focus on helping, not selling — referrals follow naturally',
    ],
    relatedArticles: ['a2', 'a6', 'a10'],
  },
  {
    id: 'a9',
    title: 'AI Assistant: Your Intelligence Copilot',
    category: 'AI',
    readTime: '6 min',
    featured: true,
    difficulty: 'Beginner',
    icon: Sparkles,
    description: 'Learn how to use the AI Assistant to analyze data, generate strategies, and optimize your entire ecosystem.',
    lastUpdated: '2025-03-13',
    sections: [
      {
        id: 's9-1',
        title: 'What the AI Assistant Can Do',
        content: `The Freedom Wheels AI Assistant is your intelligent copilot that understands your entire ecosystem. It can:

**Analysis & Insights:**
- Analyze engine performance and suggest optimizations
- Identify revenue trends and predict future earnings
- Score leads and recommend outreach strategies
- Compare your metrics against industry benchmarks

**Strategy Generation:**
- Create content calendars based on trending topics
- Design engine configurations for specific income goals
- Build referral strategies tailored to your network
- Develop traffic acquisition plans

**Problem Solving:**
- Diagnose why an engine's health has dropped
- Suggest fixes for underperforming content
- Identify bottlenecks in your conversion funnel
- Recommend pricing adjustments for marketplace products

**Automation:**
- Auto-generate responses to common lead questions
- Create email sequences for lead nurturing
- Schedule social media content at optimal times
- Generate weekly performance summaries

Access the AI Assistant from any view by clicking the **Brain icon** in the header or navigating to the AI view in the sidebar.`,
      },
      {
        id: 's9-2',
        title: 'Prompt Engineering Tips',
        content: `Get better results from the AI Assistant with these prompting techniques:

**Be Specific:**
❌ "How can I make more money?"
✅ "My Content Syndicator's RPM dropped from 142 to 89 over the past week. What could be causing this and how can I fix it?"

**Provide Context:**
❌ "Analyze my leads."
✅ "I have 5 leads: 2 Hot, 2 Warm, 1 Cold. The Hot leads are from LinkedIn and have enterprise budgets. What's the best outreach sequence for the next 7 days?"

**Ask for Structure:**
❌ "Give me engine tips."
✅ "Provide a prioritized list of 5 engine optimizations, ranked by expected revenue impact, with estimated implementation time for each."

**Request Comparisons:**
❌ "Should I use the Content Syndicator or Lead Magnet?"
✅ "Compare the Content Syndicator vs Lead Magnet Funnel for a B2B SaaS consultant with a $5K/month revenue goal. Include expected timeline to reach the goal with each engine type."

**Iterate:**
The AI learns from your follow-up questions. If the first response isn't perfect, refine your prompt based on what it provided. Each conversation builds context about your business.`,
      },
    ],
    keyTakeaways: [
      'AI Assistant analyzes engines, generates strategies, and solves problems',
      'Be specific, provide context, and ask for structured responses',
      'Request comparisons between options for better decision-making',
      'The AI improves with iterative conversation and follow-up questions',
      'Accessible from any view via the Brain icon or sidebar navigation',
    ],
    relatedArticles: ['a1', 'a4', 'a7'],
  },
  {
    id: 'a10',
    title: 'Security Best Practices',
    category: 'Security',
    readTime: '4 min',
    featured: false,
    difficulty: 'Beginner',
    icon: Shield,
    description: 'Protect your account, wallet, and engines with these essential security practices.',
    lastUpdated: '2025-03-09',
    sections: [
      {
        id: 's10-1',
        title: 'Account Security',
        content: `**Two-Factor Authentication (2FA):**
Enable 2FA from **Settings → Security**. This is mandatory for:
- Withdrawals exceeding $1,000
- Changing email or password
- API key generation
- Engine deletion

**Password Requirements:**
- Minimum 8 characters (we recommend 12+)
- Mix of uppercase, lowercase, numbers, and symbols
- Never reuse passwords from other services
- Change every 90 days

**Session Management:**
- Active sessions are shown in Settings → Security
- You can remotely sign out any session
- Sessions expire after 30 days of inactivity
- New device logins trigger email verification

**API Key Security:**
- Never share API keys in public repositories
- Rotate keys every 90 days
- Use environment variables, not hardcoded strings
- Revoke compromised keys immediately`,
      },
      {
        id: 's10-2',
        title: 'Wallet Security',
        content: `**Withdrawal Protections:**
- 5-minute cancellation window for all withdrawals
- 24-hour cooldown for new withdrawal destinations
- Email confirmation required for first-time withdrawal addresses
- Maximum daily withdrawal: $10,000 (SOVEREIGN plan: $50,000)

**Engine Security:**
- Engine credentials are encrypted at rest
- API connections use TLS 1.3
- Webhook endpoints are validated on each request
- Engine logs are retained for 90 days for audit purposes

**Data Privacy:**
- All personal data is encrypted using AES-256
- We never sell or share your data with third parties
- You can export or delete your data at any time from Settings → Privacy
- GDPR and POPIA compliant by design

**Incident Response:**
If you suspect unauthorized access:
1. Immediately change your password
2. Enable 2FA if not already active
3. Sign out all sessions from Settings → Security
4. Contact support@freedomwheels.io
5. Review transaction history for unauthorized activity`,
      },
    ],
    keyTakeaways: [
      'Enable 2FA — mandatory for large withdrawals and sensitive operations',
      'Use strong, unique passwords and change them every 90 days',
      '5-minute withdrawal cancellation window for safety',
      'API keys must be rotated every 90 days and never shared publicly',
      'All data encrypted with AES-256; GDPR and POPIA compliant',
    ],
    relatedArticles: ['a3', 'a6'],
  },
]

// ─── Video Tutorials ────────────────────────────────────────────────────

const videoTutorials: VideoTutorial[] = [
  {
    id: 'v1',
    title: 'Freedom Wheels Platform Tour',
    duration: '12:34',
    views: '2.4K',
    category: 'Getting Started',
    description: 'Complete walkthrough of the Freedom Wheels ecosystem — from signup to first revenue.',
    chapters: [
      { time: '0:00', title: 'Introduction & Dashboard' },
      { time: '2:30', title: 'Live Engines Overview' },
      { time: '5:00', title: 'Engine Builder Demo' },
      { time: '7:45', title: 'Wallet & Withdrawals' },
      { time: '10:00', title: 'AI Assistant Showcase' },
    ],
  },
  {
    id: 'v2',
    title: 'Engine Builder Deep Dive',
    duration: '18:22',
    views: '1.8K',
    category: 'Engines',
    description: 'Learn every feature of the Engine Builder — node types, connections, and advanced patterns.',
    chapters: [
      { time: '0:00', title: 'Engine Architecture' },
      { time: '3:00', title: 'Node Types Explained' },
      { time: '7:30', title: 'Building a Content Engine' },
      { time: '12:00', title: 'Conditional Routing' },
      { time: '15:00', title: 'Testing & Deployment' },
    ],
  },
  {
    id: 'v3',
    title: 'Lead Intelligence Workshop',
    duration: '24:15',
    views: '3.1K',
    category: 'Leads',
    description: 'Master lead scoring, segmentation, and conversion strategies with hands-on examples.',
    chapters: [
      { time: '0:00', title: 'Lead Scoring Model' },
      { time: '5:00', title: 'Hot/Warm/Cold Strategies' },
      { time: '10:30', title: 'Outreach Automation' },
      { time: '16:00', title: 'Conversion Funnel Analysis' },
      { time: '20:00', title: 'Q&A with Founder' },
    ],
  },
  {
    id: 'v4',
    title: 'Wallet & Asset Management',
    duration: '15:08',
    views: '1.2K',
    category: 'Wallet',
    description: 'Everything about managing your multi-asset wallet, withdrawals, and tax reporting.',
    chapters: [
      { time: '0:00', title: 'Wallet Overview' },
      { time: '3:00', title: 'Fiat vs Crypto Assets' },
      { time: '6:30', title: 'Withdrawal Process' },
      { time: '9:00', title: 'Currency Conversion' },
      { time: '12:00', title: 'Tax Reports' },
    ],
  },
  {
    id: 'v5',
    title: 'Referral Network Masterclass',
    duration: '20:45',
    views: '2.7K',
    category: 'Growth',
    description: 'Build a referral empire with proven strategies from top Freedom Wheels referrers.',
    chapters: [
      { time: '0:00', title: 'Referral Program Overview' },
      { time: '4:00', title: 'Content-Driven Referrals' },
      { time: '8:30', title: 'Community Strategies' },
      { time: '13:00', title: 'Scaling Your Network' },
      { time: '17:00', title: 'Top Earner Case Studies' },
    ],
  },
  {
    id: 'v6',
    title: 'AI Assistant Pro Tips',
    duration: '14:20',
    views: '1.5K',
    category: 'AI',
    description: 'Advanced prompting techniques and real-world examples for maximum AI assistant productivity.',
    chapters: [
      { time: '0:00', title: 'Prompt Engineering Basics' },
      { time: '3:30', title: 'Context & Specificity' },
      { time: '7:00', title: 'Multi-Step Workflows' },
      { time: '10:00', title: 'Automation with AI' },
      { time: '12:30', title: 'Live Demo Session' },
    ],
  },
]

// ─── Instructors ────────────────────────────────────────────────────────

const instructors = [
  { name: 'Maphalle Malatji', role: 'Founder & Master Architect', courses: 12, specialty: 'System Architecture' },
  { name: 'Dr. Sarah Chen', role: 'AI Strategy Lead', courses: 8, specialty: 'AI & Automation' },
  { name: 'James Okonkwo', role: 'Automation Specialist', courses: 6, specialty: 'Workflow Design' },
  { name: 'Elena Vasquez', role: 'Growth Strategist', courses: 5, specialty: 'Traffic & Referrals' },
]

// ─── Difficulty colors ──────────────────────────────────────────────────

const difficultyConfig = {
  Beginner: { color: 'text-fw-green', bg: 'bg-fw-green/10', border: 'border-fw-green/30' },
  Intermediate: { color: 'text-fw-gold', bg: 'bg-fw-gold/10', border: 'border-fw-gold/30' },
  Advanced: { color: 'text-fw-red', bg: 'bg-fw-red/10', border: 'border-fw-red/30' },
}

// ─── View States ────────────────────────────────────────────────────────

type ViewState = 'browse' | 'article' | 'video'

// ─── Main Component ────────────────────────────────────────────────────

export default function KnowledgeBaseView() {
  const [viewState, setViewState] = useState<ViewState>('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [readArticles, setReadArticles] = useState<string[]>([])
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [showToc, setShowToc] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const { dispatch } = useEngineBus()

  const selectedArticle = articles.find((a) => a.id === selectedArticleId)
  const selectedVideo = videoTutorials.find((v) => v.id === selectedVideoId)

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (activeCategory !== 'All' && a.category !== activeCategory) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.keyTakeaways.some((t) => t.toLowerCase().includes(q)) ||
          a.sections.some((s) => s.content.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [activeCategory, searchQuery])

  const filteredVideos = useMemo(() => {
    return videoTutorials.filter((v) => {
      if (activeCategory !== 'All' && v.category !== activeCategory) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [activeCategory, searchQuery])

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    )
  }, [])

  const openArticle = useCallback((id: string) => {
    setSelectedArticleId(id)
    setViewState('article')
    setActiveSectionId(null)
    setReadArticles((prev) => (prev.includes(id) ? prev : [...prev, id]))

    // Dispatch engine bus event
    const article = articles.find((a) => a.id === id)
    if (article) {
      dispatch({
        source: 'content-engine',
        type: 'content:published',
        target: 'traffic-engine',
        payload: { articleId: id, category: article.category },
        meta: {},
      })
    }
  }, [dispatch])

  const openVideo = useCallback((id: string) => {
    setSelectedVideoId(id)
    setViewState('video')
  }, [])

  const goBack = useCallback(() => {
    setViewState('browse')
    setSelectedArticleId(null)
    setSelectedVideoId(null)
    setActiveSectionId(null)
  }, [])

  const bookmarkedArticles = useMemo(() => {
    return articles.filter((a) => bookmarks.includes(a.id))
  }, [bookmarks])

  const featuredArticles = useMemo(() => {
    return articles.filter((a) => a.featured)
  }, [])

  // ─── Article Reading View ──────────────────────────────────────────
  if (viewState === 'article' && selectedArticle) {
    const diffConfig = difficultyConfig[selectedArticle.difficulty]
    const isBookmarked = bookmarks.includes(selectedArticle.id)
    const relatedArticlesData = selectedArticle.relatedArticles
      .map((id) => articles.find((a) => a.id === id))
      .filter(Boolean) as Article[]

    return (
      <div className="p-4 md:p-6 fw-scrollbar overflow-y-auto h-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            onClick={goBack}
            variant="ghost"
            size="sm"
            className="text-fw-dim hover:text-fw-text h-8 px-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <ChevronRight className="w-3 h-3 text-fw-dim" />
          <span className="text-xs text-fw-dim font-mono tracking-wider uppercase">
            Knowledge Base
          </span>
          <ChevronRight className="w-3 h-3 text-fw-dim" />
          <span className="text-xs text-fw-accent font-mono tracking-wider uppercase">
            {selectedArticle.category}
          </span>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Article Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`text-[9px] ${diffConfig.color} ${diffConfig.bg} ${diffConfig.border} border`}>
                  {selectedArticle.difficulty}
                </Badge>
                <Badge variant="outline" className="text-[9px] border-fw-accent/30 text-fw-accent">
                  {selectedArticle.category}
                </Badge>
                <span className="text-[10px] text-fw-dim font-mono flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {selectedArticle.readTime}
                </span>
                <span className="text-[10px] text-fw-dim font-mono">
                  Updated {selectedArticle.lastUpdated}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-wider uppercase mb-2">
                {selectedArticle.title}
              </h1>
              <p className="text-fw-dim text-sm font-mono leading-relaxed">
                {selectedArticle.description}
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Button
                  onClick={() => toggleBookmark(selectedArticle.id)}
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 ${isBookmarked ? 'text-fw-gold hover:text-fw-gold' : 'text-fw-dim hover:text-fw-gold'}`}
                >
                  {isBookmarked ? (
                    <><BookmarkCheck className="w-4 h-4 mr-1" /> Bookmarked</>
                  ) : (
                    <><Bookmark className="w-4 h-4 mr-1" /> Bookmark</>
                  )}
                </Button>
                <Button
                  onClick={() => setShowToc(!showToc)}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-fw-dim hover:text-fw-text lg:hidden"
                >
                  <List className="w-4 h-4 mr-1" /> Contents
                </Button>
              </div>
            </div>

            {/* Article Sections */}
            <div className="space-y-8">
              {selectedArticle.sections.map((section) => (
                <div key={section.id} id={section.id}>
                  <h2 className="text-lg font-bold tracking-wider uppercase mb-3 text-fw-text flex items-center gap-2">
                    <div className="w-1 h-6 bg-fw-accent rounded-full" />
                    {section.title}
                  </h2>
                  <div className="text-sm text-fw-dim font-mono leading-relaxed whitespace-pre-line pl-4">
                    {section.content.split('**').map((part, i) =>
                      i % 2 === 1 ? (
                        <strong key={i} className="text-fw-text font-bold">{part}</strong>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Key Takeaways */}
            <div className="mt-8 p-6 rounded-lg border border-fw-accent/20 bg-fw-accent/5">
              <h3 className="text-sm font-bold tracking-widest uppercase text-fw-accent mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Key Takeaways
              </h3>
              <div className="space-y-3">
                {selectedArticle.keyTakeaways.map((takeaway, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-fw-green flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-fw-text font-mono leading-relaxed">{takeaway}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Articles */}
            {relatedArticlesData.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-bold tracking-widest uppercase text-fw-dim mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Related Articles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedArticlesData.map((article) => {
                    const rDiffConfig = difficultyConfig[article.difficulty]
                    return (
                      <Card
                        key={article.id}
                        className="bg-fw-surface border-fw-border hover:border-fw-accent/30 transition-colors cursor-pointer"
                        onClick={() => openArticle(article.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-[8px] ${rDiffConfig.color} ${rDiffConfig.bg} ${rDiffConfig.border} border`}>
                              {article.difficulty}
                            </Badge>
                            <span className="text-[9px] text-fw-dim font-mono">{article.readTime}</span>
                          </div>
                          <h4 className="text-xs font-bold tracking-wider uppercase">{article.title}</h4>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Table of Contents Sidebar (desktop) */}
          <div className={`hidden lg:block w-56 flex-shrink-0 ${showToc ? 'block' : ''}`}>
            <div className="sticky top-6">
              <h4 className="text-[10px] font-mono tracking-widest uppercase text-fw-dim mb-3">
                Table of Contents
              </h4>
              <nav className="space-y-1">
                {selectedArticle.sections.map((section, i) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      const el = document.getElementById(section.id)
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      setActiveSectionId(section.id)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-mono tracking-wider transition-colors ${
                      activeSectionId === section.id
                        ? 'bg-fw-accent/10 text-fw-accent'
                        : 'text-fw-dim hover:text-fw-text hover:bg-fw-bg'
                    }`}
                  >
                    {i + 1}. {section.title}
                  </button>
                ))}
              </nav>

              {/* Progress Indicator */}
              <div className="mt-6 p-3 rounded-lg border border-fw-border bg-fw-bg">
                <p className="text-[9px] font-mono tracking-widest uppercase text-fw-dim mb-1">
                  Reading Progress
                </p>
                <div className="w-full h-1.5 bg-fw-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-fw-accent rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((readArticles.length / articles.length) * 100)}%` }}
                  />
                </div>
                <p className="text-[9px] font-mono text-fw-dim mt-1">
                  {readArticles.length}/{articles.length} articles read
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Video Detail View ─────────────────────────────────────────────
  if (viewState === 'video' && selectedVideo) {
    return (
      <div className="p-4 md:p-6 fw-scrollbar overflow-y-auto h-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Button onClick={goBack} variant="ghost" size="sm" className="text-fw-dim hover:text-fw-text h-8 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <ChevronRight className="w-3 h-3 text-fw-dim" />
          <span className="text-xs text-fw-dim font-mono tracking-wider uppercase">Video Tutorials</span>
          <ChevronRight className="w-3 h-3 text-fw-dim" />
          <span className="text-xs text-fw-accent font-mono tracking-wider uppercase">{selectedVideo.category}</span>
        </div>

        {/* Video Player Placeholder */}
        <Card className="bg-fw-surface border-fw-border mb-6 overflow-hidden">
          <div className="relative w-full aspect-video bg-fw-bg flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-fw-accent/5 to-fw-purple/5" />
            <div className="relative text-center">
              <div className="w-20 h-20 rounded-full bg-fw-accent/10 flex items-center justify-center mx-auto mb-4 fw-glow-strong">
                <Play className="w-10 h-10 text-fw-accent ml-1" />
              </div>
              <h3 className="text-lg font-bold tracking-wider uppercase">{selectedVideo.title}</h3>
              <p className="text-fw-dim text-sm font-mono mt-2">{selectedVideo.duration} • {selectedVideo.views} views</p>
            </div>
          </div>
        </Card>

        {/* Video Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold tracking-wider uppercase mb-2">{selectedVideo.title}</h2>
            <p className="text-fw-dim text-sm font-mono mb-4">{selectedVideo.description}</p>
            <Badge variant="outline" className="text-[9px] border-fw-accent/30 text-fw-accent">
              {selectedVideo.category}
            </Badge>
          </div>

          {/* Chapters */}
          <div>
            <h3 className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-3">Chapters</h3>
            <Card className="bg-fw-surface border-fw-border">
              <CardContent className="p-0">
                <div className="divide-y divide-fw-border">
                  {selectedVideo.chapters.map((chapter, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 hover:bg-fw-bg/50 transition-colors cursor-pointer">
                      <span className="text-[10px] font-mono text-fw-accent min-w-[40px]">{chapter.time}</span>
                      <span className="text-xs font-mono text-fw-text">{chapter.title}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // ─── Browse View ───────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-widest uppercase">
              Knowledge Base
            </h2>
            <Badge className="text-[9px] bg-fw-accent/10 text-fw-accent border border-fw-accent/30">
              {articles.length} Articles
            </Badge>
          </div>
          <p className="text-fw-dim text-sm font-mono mt-1">
            Master the Freedom Wheels™ ecosystem
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bookmarkedArticles.length > 0 && (
            <Badge variant="outline" className="text-[9px] border-fw-gold/30 text-fw-gold">
              <BookmarkCheck className="w-3 h-3 mr-1" /> {bookmarkedArticles.length} Saved
            </Badge>
          )}
          <Badge variant="outline" className="text-[9px] border-fw-green/30 text-fw-green">
            <CheckCircle2 className="w-3 h-3 mr-1" /> {readArticles.length} Read
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fw-dim" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search articles, tutorials, and guides..."
          className="bg-fw-bg border-fw-border pl-10 font-mono text-sm focus:border-fw-accent/50"
        />
        {searchQuery && (
          <Button
            onClick={() => setSearchQuery('')}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-fw-dim hover:text-fw-text"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const CatIcon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-fw-accent/10 text-fw-accent border border-fw-accent/30'
                  : 'border border-fw-border text-fw-dim hover:border-fw-accent/20 hover:text-fw-text'
              }`}
            >
              <CatIcon className="w-3 h-3" />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Bookmarked Articles (when no search active) */}
      {!searchQuery && activeCategory === 'All' && bookmarkedArticles.length > 0 && (
        <div>
          <h3 className="text-xs font-mono tracking-widest uppercase text-fw-gold mb-3 flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4" /> Your Bookmarks
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bookmarkedArticles.map((article) => {
              const diffConfig = difficultyConfig[article.difficulty]
              return (
                <Card
                  key={`bm-${article.id}`}
                  className="bg-fw-surface border-fw-gold/20 hover:border-fw-gold/40 transition-colors cursor-pointer"
                  onClick={() => openArticle(article.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BookmarkCheck className="w-3 h-3 text-fw-gold" />
                      <Badge className={`text-[8px] ${diffConfig.color} ${diffConfig.bg} ${diffConfig.border} border`}>
                        {article.difficulty}
                      </Badge>
                    </div>
                    <h4 className="text-xs font-bold tracking-wider uppercase">{article.title}</h4>
                    <p className="text-[10px] text-fw-dim font-mono mt-1 line-clamp-2">{article.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Featured Articles (when no search active) */}
      {!searchQuery && activeCategory === 'All' && (
        <div>
          <h3 className="text-xs font-mono tracking-widest uppercase text-fw-accent mb-3 flex items-center gap-2">
            <Star className="w-4 h-4" /> Featured Guides
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredArticles.map((article) => {
              const diffConfig = difficultyConfig[article.difficulty]
              const isRead = readArticles.includes(article.id)
              return (
                <Card
                  key={`feat-${article.id}`}
                  className="bg-fw-surface border-fw-accent/20 hover:border-fw-accent/40 transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => openArticle(article.id)}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-fw-accent/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="p-4 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-3 h-3 text-fw-gold fill-fw-gold" />
                      <Badge className={`text-[8px] ${diffConfig.color} ${diffConfig.bg} ${diffConfig.border} border`}>
                        {article.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-[8px] border-fw-accent/30 text-fw-accent">
                        {article.category}
                      </Badge>
                      {isRead && <CheckCircle2 className="w-3 h-3 text-fw-green ml-auto" />}
                    </div>
                    <h4 className="text-sm font-bold tracking-wider uppercase mb-1 group-hover:text-fw-accent transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-[10px] text-fw-dim font-mono line-clamp-2">{article.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[10px] text-fw-dim font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {article.readTime}
                      </span>
                      <span className="text-[10px] text-fw-dim font-mono">
                        {article.sections.length} sections
                      </span>
                      <ArrowRight className="w-3 h-3 text-fw-accent ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* All Articles */}
      <div>
        <h3 className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {searchQuery ? `Search Results (${filteredArticles.length})` : 'All Articles & Guides'}
        </h3>
        {filteredArticles.length === 0 ? (
          <Card className="bg-fw-surface border-fw-border">
            <CardContent className="p-8 text-center">
              <Search className="w-8 h-8 text-fw-dim/30 mx-auto mb-3" />
              <p className="text-sm font-mono text-fw-dim">No articles found matching your search.</p>
              <Button
                onClick={() => { setSearchQuery(''); setActiveCategory('All') }}
                variant="ghost"
                size="sm"
                className="mt-3 text-fw-accent hover:text-fw-accent"
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredArticles.map((article) => {
              const diffConfig = difficultyConfig[article.difficulty]
              const isRead = readArticles.includes(article.id)
              const isBookmarked = bookmarks.includes(article.id)
              const ArticleIcon = article.icon

              return (
                <Card
                  key={article.id}
                  className="bg-fw-surface border-fw-border hover:border-fw-accent/30 transition-all cursor-pointer group"
                  onClick={() => openArticle(article.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0,242,255,0.1)' }}>
                          <ArticleIcon className="w-3.5 h-3.5 text-fw-accent" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-[8px] ${diffConfig.color} ${diffConfig.bg} ${diffConfig.border} border`}>
                            {article.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-[8px] border-fw-accent/30 text-fw-accent">
                            {article.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isRead && <CheckCircle2 className="w-3 h-3 text-fw-green" />}
                        {isBookmarked && <BookmarkCheck className="w-3 h-3 text-fw-gold" />}
                      </div>
                    </div>
                    <h4 className="text-xs font-bold tracking-wider uppercase mb-1 group-hover:text-fw-accent transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-[10px] text-fw-dim font-mono line-clamp-2">{article.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[10px] text-fw-dim font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {article.readTime}
                      </span>
                      <span className="text-[10px] text-fw-dim font-mono">
                        {article.sections.length} sections
                      </span>
                      <span className="text-[10px] text-fw-dim font-mono">
                        {article.keyTakeaways.length} takeaways
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Video Tutorials */}
      <div>
        <h3 className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-4 flex items-center gap-2">
          <Video className="w-4 h-4" /> Video Tutorials
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <Card
              key={video.id}
              className="bg-fw-surface border-fw-border hover:border-fw-accent/30 transition-all cursor-pointer group overflow-hidden"
              onClick={() => openVideo(video.id)}
            >
              {/* Video thumbnail placeholder */}
              <div className="relative w-full aspect-video bg-fw-bg flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-fw-accent/5 to-fw-purple/5" />
                <div className="relative w-12 h-12 rounded-full bg-fw-accent/10 flex items-center justify-center group-hover:bg-fw-accent/20 transition-colors">
                  <Play className="w-6 h-6 text-fw-accent ml-0.5" />
                </div>
                <span className="absolute bottom-2 right-2 text-[9px] font-mono text-white bg-black/60 px-1.5 py-0.5 rounded">
                  {video.duration}
                </span>
              </div>
              <CardContent className="p-3">
                <h4 className="text-xs font-bold tracking-wider uppercase group-hover:text-fw-accent transition-colors">
                  {video.title}
                </h4>
                <p className="text-[10px] text-fw-dim font-mono mt-1 line-clamp-2">{video.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-[8px] border-fw-accent/30 text-fw-accent">
                    {video.category}
                  </Badge>
                  <span className="text-[9px] text-fw-dim font-mono">{video.views} views</span>
                  <span className="text-[9px] text-fw-dim font-mono">{video.chapters.length} chapters</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Master Instructors */}
      <Card className="bg-fw-surface border-fw-border">
        <CardHeader>
          <CardTitle className="text-xs font-mono tracking-widest uppercase text-fw-dim flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-fw-gold" />
            Master Instructors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {instructors.map((inst) => (
              <div
                key={inst.name}
                className="p-4 rounded-lg border border-fw-border bg-fw-bg text-center hover:border-fw-accent/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-fw-accent/10 flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="w-6 h-6 text-fw-accent" />
                </div>
                <h4 className="text-sm font-bold tracking-wider uppercase">
                  {inst.name}
                </h4>
                <p className="text-[10px] text-fw-dim font-mono mt-0.5">
                  {inst.role}
                </p>
                <p className="text-[9px] text-fw-accent font-mono mt-1">
                  {inst.specialty}
                </p>
                <p className="text-xs text-fw-gold font-mono mt-2">
                  {inst.courses} courses
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reading Progress */}
      <Card className="bg-fw-surface border-fw-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-fw-dim">
              Your Reading Progress
            </span>
            <span className="text-[10px] font-mono text-fw-accent">
              {readArticles.length}/{articles.length} articles
            </span>
          </div>
          <div className="w-full h-2 bg-fw-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fw-accent to-fw-green rounded-full transition-all duration-500"
              style={{ width: `${Math.round((readArticles.length / articles.length) * 100)}%` }}
            />
          </div>
          {readArticles.length === articles.length && (
            <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-fw-green/5 border border-fw-green/20">
              <CheckCircle2 className="w-4 h-4 text-fw-green" />
              <span className="text-xs font-mono text-fw-green">You&apos;ve read all articles! You&apos;re a Freedom Wheels expert.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
