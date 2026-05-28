'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  BookOpen,
  Search,
  Play,
  FileText,
  Video,
  GraduationCap,
  Clock,
  Star,
} from 'lucide-react'
import { useState } from 'react'

const categories = ['All', 'Getting Started', 'Engines', 'Leads', 'Wallet', 'Traffic', 'Automation']

const articles = [
  { id: 'a1', title: 'Building Your First Income Engine', category: 'Engines', readTime: '5 min', featured: true },
  { id: 'a2', title: 'Lead Scoring: The Complete Guide', category: 'Leads', readTime: '8 min', featured: true },
  { id: 'a3', title: 'Multi-Asset Wallet Configuration', category: 'Wallet', readTime: '4 min', featured: false },
  { id: 'a4', title: 'AI Content Generation Best Practices', category: 'Traffic', readTime: '6 min', featured: false },
  { id: 'a5', title: 'Automation Workflow Patterns', category: 'Automation', readTime: '7 min', featured: false },
  { id: 'a6', title: 'Quick Start: From Zero to First Revenue', category: 'Getting Started', readTime: '3 min', featured: true },
  { id: 'a7', title: 'Advanced Engine Node Configuration', category: 'Engines', readTime: '10 min', featured: false },
  { id: 'a8', title: 'Referral Network Growth Strategy', category: 'Getting Started', readTime: '5 min', featured: false },
]

const videos = [
  { id: 'v1', title: 'Freedom Wheels Platform Tour', duration: '12:34', views: '2.4K' },
  { id: 'v2', title: 'Engine Builder Deep Dive', duration: '18:22', views: '1.8K' },
  { id: 'v3', title: 'Lead Intelligence Workshop', duration: '24:15', views: '3.1K' },
  { id: 'v4', title: 'Wallet & Asset Management', duration: '15:08', views: '1.2K' },
]

const instructors = [
  { name: 'Marcus Freedom', role: 'Founder & Chief Architect', courses: 12 },
  { name: 'Dr. Sarah Chen', role: 'AI Strategy Lead', courses: 8 },
  { name: 'James Okonkwo', role: 'Automation Specialist', courses: 6 },
]

export default function KnowledgeBaseView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filteredArticles = articles.filter((a) => {
    if (activeCategory !== 'All' && a.category !== activeCategory) return false
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()))
      return false
    return true
  })

  return (
    <div className="p-4 md:p-6 space-y-6 fw-scrollbar overflow-y-auto h-full">
      <div>
        <h2 className="text-xl font-bold tracking-widest uppercase">
          Knowledge Base
        </h2>
        <p className="text-fw-dim text-sm font-mono">
          Master the Freedom Wheels ecosystem
        </p>
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
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-fw-accent/10 text-fw-accent border border-fw-accent/30'
                : 'border border-fw-border text-fw-dim hover:border-fw-accent/20 hover:text-fw-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div>
        <h3 className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Articles & Guides
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              className="bg-fw-surface border-fw-border hover:border-fw-accent/30 transition-colors cursor-pointer"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {article.featured && (
                        <Star className="w-3 h-3 text-fw-gold fill-fw-gold" />
                      )}
                      <h4 className="text-sm font-bold tracking-wider uppercase truncate">
                        {article.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[9px] border-fw-accent/30 text-fw-accent"
                      >
                        {article.category}
                      </Badge>
                      <span className="text-[10px] text-fw-dim font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {article.readTime}
                      </span>
                    </div>
                  </div>
                  <BookOpen className="w-5 h-5 text-fw-dim flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Video Tutorials */}
      <div>
        <h3 className="text-xs font-mono tracking-widest uppercase text-fw-dim mb-4 flex items-center gap-2">
          <Video className="w-4 h-4" />
          Video Tutorials
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="bg-fw-surface border-fw-border hover:border-fw-accent/30 transition-colors cursor-pointer"
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-fw-accent/10 flex items-center justify-center flex-shrink-0">
                    <Play className="w-5 h-5 text-fw-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold tracking-wider uppercase truncate">
                      {video.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-fw-dim font-mono">
                        {video.duration}
                      </span>
                      <span className="text-[10px] text-fw-dim font-mono">
                        {video.views} views
                      </span>
                    </div>
                  </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {instructors.map((inst) => (
              <div
                key={inst.name}
                className="p-4 rounded-lg border border-fw-border bg-fw-bg text-center"
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
                <p className="text-xs text-fw-accent font-mono mt-2">
                  {inst.courses} courses
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
