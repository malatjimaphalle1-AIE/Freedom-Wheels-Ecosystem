'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Download, Image as ImageIcon, Loader2, Film, Copy, Check, Wand2, Upload, FileImage } from 'lucide-react'

interface GeneratedImage {
  image: string // data URL
  prompt: string
  fullPrompt: string
  size: string
  style: string
  generatedAt: string
}

const SIZE_OPTIONS = [
  { value: '1024x1024', label: 'Square (1024×1024)', use: 'Instagram, social media, product photos' },
  { value: '1344x768', label: 'Landscape (1344×768)', use: 'Blog headers, YouTube thumbnails' },
  { value: '1440x720', label: 'Wide (1440×720)', use: 'Hero banners, OG images, website headers' },
  { value: '768x1344', label: 'Portrait (768×1344)', use: 'Stories, TikTok, Reels' },
  { value: '1152x864', label: 'Standard (1152×864)', use: 'Facebook posts, presentations' },
  { value: '864x1152', label: 'Tall (864×1152)', use: 'Pinterest, infographics' },
  { value: '720x1440', label: 'Phone (720×1440)', use: 'Phone wallpapers, tall banners' },
]

const STYLE_OPTIONS = [
  { value: 'product-photo', label: 'Product Photo', desc: 'Studio lighting, white background' },
  { value: 'marketing-banner', label: 'Marketing Banner', desc: 'Clean layout, vibrant colors' },
  { value: 'social-media-post', label: 'Social Media Post', desc: 'Eye-catching, bold typography area' },
  { value: 'lifestyle-photo', label: 'Lifestyle Photo', desc: 'Natural lighting, authentic feel' },
  { value: 'illustration', label: 'Illustration', desc: 'Digital art, colorful, creative' },
  { value: 'minimalist', label: 'Minimalist', desc: 'Clean, simple, elegant' },
  { value: 'hero-banner', label: 'Hero Banner', desc: 'Wide, professional, website header' },
  { value: 'infographic', label: 'Infographic', desc: 'Data visualization, icons' },
]

const PROMPT_IDEAS = [
  'A freelancer working on a laptop in a cozy home office in South Africa',
  'A diverse group of entrepreneurs collaborating in a modern co-working space',
  'A sleek laptop on a clean desk with coffee, representing remote work lifestyle',
  'South African cityscape with entrepreneurs walking confidently',
  'A person celebrating success after receiving business funding',
  'Modern tech gadgets arranged neatly for a product showcase',
  'A freelancer video calling clients from a home office setup',
  'Load shedding solution: portable power station powering a home office',
]

export default function AIGeneratorPage() {
  const [apiKey, setApiKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('generate')
  const [prompt, setPrompt] = useState('')
  const [size, setSize] = useState('1024x1024')
  const [style, setStyle] = useState('product-photo')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState<GeneratedImage | null>(null)
  const [history, setHistory] = useState<GeneratedImage[]>([])
  const [copied, setCopied] = useState(false)

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<{ url: string; name: string } | null>(null)
  const [uploadHistory, setUploadHistory] = useState<{ url: string; name: string }[]>([])

  // Campaign creator state
  const [campaignMode, setCampaignMode] = useState(false)
  const [campaignImages, setCampaignImages] = useState<GeneratedImage[]>([])
  const [campaignCaptions, setCampaignCaptions] = useState<string[]>([])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setError(null)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['X-Admin-Key'] = apiKey

      const res = await fetch('/api/admin/ai-generate-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt, size, style }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setGenerated(data)
      setHistory(prev => [data, ...prev].slice(0, 20))

      if (campaignMode) {
        setCampaignImages(prev => [...prev, data])
        setCampaignCaptions(prev => [...prev, ''])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setGenerating(false)
    }
  }, [prompt, size, style, apiKey, campaignMode])

  function downloadImage(image: GeneratedImage, filename?: string) {
    const link = document.createElement('a')
    link.href = image.image
    const name = filename || `fwe-${image.style}-${Date.now()}.png`
    link.download = name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function copyPrompt(prompt: string) {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function applyIdea(idea: string) {
    setPrompt(idea)
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const headers: Record<string, string> = {}
      if (apiKey) headers['X-Admin-Key'] = apiKey

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers,
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      const newImage = { url: data.url, name: data.name }
      setUploadedImage(newImage)
      setUploadHistory(prev => [newImage, ...prev].slice(0, 10))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    }
  }

  function startCampaign() {
    setCampaignMode(true)
    setCampaignImages([])
    setCampaignCaptions([])
  }

  function finishCampaign() {
    setCampaignMode(false)
  }

  function clearCampaign() {
    setCampaignImages([])
    setCampaignCaptions([])
  }

  function updateCaption(index: number, text: string) {
    setCampaignCaptions(prev => prev.map((c, i) => i === index ? text : c))
  }

  function downloadCampaign() {
    // Create a text file with all prompts + captions for video creation
    let content = 'FREEDOM WHEELS — MARKETING CAMPAIGN STORYBOARD\n'
    content += `Generated: ${new Date().toLocaleString()}\n`
    content += `Images: ${campaignImages.length}\n`
    content += '='.repeat(60) + '\n\n'

    campaignImages.forEach((img, i) => {
      content += `--- SCENE ${i + 1} ---\n`
      content += `Image: fwe-campaign-${i + 1}.png (${img.size})\n`
      content += `Prompt: ${img.prompt}\n`
      content += `Caption: ${campaignCaptions[i] || '(no caption)'}\n`
      content += '\n'
    })

    content += '='.repeat(60) + '\n'
    content += 'INSTRUCTIONS:\n'
    content += '1. Download each image above\n'
    content += '2. Open CapCut, Canva, or any free video editor\n'
    content += '3. Add each image as a 3-5 second clip\n'
    content += '4. Add the captions as text overlays\n'
    content += '5. Add background music (royalty-free from YouTube Audio Library)\n'
    content += '6. Export as MP4 and share on social media\n'

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fwe-campaign-storyboard-${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
              <span className="font-semibold">Admin · AI Generator</span>
            </Link>
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to admin
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" /> AI Marketing Generator
              </CardTitle>
              <CardDescription>Enter your ADMIN_API_KEY to access the AI generator</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); if (apiKey) setAuthed(true) }} className="space-y-3">
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="ADMIN_API_KEY" />
                <Button type="submit" className="w-full" disabled={!apiKey}>Authenticate</Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-sm">FW</div>
            <span className="font-semibold">Admin · AI Generator</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={campaignMode ? 'default' : 'outline'} onClick={campaignMode ? finishCampaign : startCampaign}>
              <Film className="h-4 w-4 mr-1" /> {campaignMode ? 'Finish Campaign' : 'Campaign Mode'}
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Tab selector */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'generate'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="h-4 w-4 inline mr-1" /> AI Generate
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="h-4 w-4 inline mr-1" /> Upload Image
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upload area */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5 text-emerald-600" /> Upload Image
                </CardTitle>
                <CardDescription>
                  Upload your own image files (PNG, JPG, WebP, GIF). Max 5MB.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag & drop area */}
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed rounded-lg p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                      <div className="text-sm text-muted-foreground">Uploading…</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileImage className="h-12 w-12 text-muted-foreground" />
                      <div className="text-sm font-medium">Click to select or drag & drop</div>
                      <div className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF — max 5MB</div>
                    </div>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={onFileSelect}
                    className="hidden"
                  />
                </div>

                {uploadError && (
                  <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-3 rounded">
                    {uploadError}
                  </div>
                )}

                {/* Upload history */}
                {uploadHistory.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Recent uploads:</Label>
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      {uploadHistory.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setUploadedImage(img)}
                          className="aspect-square border rounded overflow-hidden hover:opacity-80"
                        >
                          <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            <div>
              {uploadedImage ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileImage className="h-4 w-4" /> Uploaded Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="border rounded-lg overflow-hidden bg-muted">
                      <img src={uploadedImage.url} alt={uploadedImage.name} className="w-full h-auto" />
                    </div>
                    <div className="text-xs text-muted-foreground">File: {uploadedImage.name}</div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = uploadedImage.url
                          link.download = uploadedImage.name
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(uploadedImage.url)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      💡 To use in a guide: download this image → upload to GitHub (public/images/) → use the URL in your guide Markdown.
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <div className="text-sm text-muted-foreground">
                      Select or drag an image file to upload.
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <>
        {campaignMode && (
          <Card className="mb-6 border-violet-300 bg-violet-50 dark:bg-violet-950/30">
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-violet-700 dark:text-violet-400 flex items-center gap-2">
                  <Film className="h-4 w-4" /> Campaign Mode Active
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Generate multiple images for a video storyboard. Each image you generate will be added to your campaign. Add captions, then download the storyboard.
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{campaignImages.length} images</Badge>
                {campaignImages.length > 0 && (
                  <>
                    <Button size="sm" variant="outline" onClick={clearCampaign}>Clear</Button>
                    <Button size="sm" onClick={downloadCampaign}>Download Storyboard</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Input controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-emerald-600" /> Generate Image
                </CardTitle>
                <CardDescription>
                  Describe what you want — AI generates a marketing-ready image.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prompt */}
                <div>
                  <Label>Describe your image *</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    placeholder="A freelancer working on a laptop in a cozy home office in South Africa"
                    className="mt-1"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Be descriptive — include subject, setting, mood, colors, and style.
                  </div>
                </div>

                {/* Prompt ideas */}
                <div>
                  <Label className="text-xs text-muted-foreground">Quick ideas (click to use):</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {PROMPT_IDEAS.slice(0, 4).map((idea, i) => (
                      <button
                        key={i}
                        onClick={() => applyIdea(idea)}
                        className="text-xs px-2 py-1 border rounded-full hover:bg-muted transition-colors"
                      >
                        {idea.slice(0, 40)}…
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style */}
                <div>
                  <Label>Style preset</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {STYLE_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setStyle(s.value)}
                        className={`text-left p-2 border rounded text-xs transition-colors ${
                          style === s.value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'hover:bg-muted'
                        }`}
                      >
                        <div className="font-medium">{s.label}</div>
                        <div className="text-muted-foreground">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <Label>Image size</Label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-md bg-background text-sm"
                  >
                    {SIZE_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label} — {s.use}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Generate button */}
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating image…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>

                {error && (
                  <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 p-3 rounded">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History */}
            {history.length > 0 && !campaignMode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> Recent ({history.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {history.slice(0, 9).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setGenerated(img)}
                        className="aspect-square border rounded overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img src={img.image} alt={img.prompt} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Generated image preview */}
          <div className="space-y-4">
            {generated ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Generated Image
                    </span>
                    <Badge variant="secondary">{generated.size}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Image preview */}
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={generated.image}
                      alt={generated.prompt}
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Prompt used */}
                  <div className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground font-medium">Prompt:</span>
                      <button
                        onClick={() => copyPrompt(generated.prompt)}
                        className="text-emerald-600 hover:underline inline-flex items-center gap-1"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-foreground bg-muted/50 p-2 rounded">{generated.prompt}</p>
                  </div>

                  {/* Style + size */}
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{STYLE_OPTIONS.find(s => s.value === generated.style)?.label || generated.style}</Badge>
                    <Badge variant="outline">{generated.size}</Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button onClick={() => downloadImage(generated)} className="flex-1">
                      <Download className="h-4 w-4 mr-1" /> Download PNG
                    </Button>
                    {campaignMode && (
                      <Button variant="outline" onClick={handleGenerate}>
                        <Sparkles className="h-4 w-4 mr-1" /> Generate Next
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <div className="text-sm text-muted-foreground">
                    Enter a prompt and click &quot;Generate Image&quot; to create marketing visuals with AI.
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Free image generation — no API key required.
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Campaign storyboard */}
            {campaignMode && campaignImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Film className="h-4 w-4" /> Campaign Storyboard ({campaignImages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {campaignImages.map((img, i) => (
                    <div key={i} className="flex gap-3 border rounded p-2">
                      <img src={img.image} alt={img.prompt} className="w-16 h-16 object-cover rounded flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium mb-1">Scene {i + 1}</div>
                        <Input
                          value={campaignCaptions[i] || ''}
                          onChange={(e) => updateCaption(i, e.target.value)}
                          placeholder="Caption for this scene…"
                          className="text-xs h-7"
                        />
                        <div className="text-xs text-muted-foreground mt-1 truncate">{img.prompt}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-shrink-0"
                        onClick={() => downloadImage(img, `fwe-campaign-${i + 1}.png`)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {campaignImages.length >= 2 && (
                    <Button onClick={downloadCampaign} className="w-full">
                      <Download className="h-4 w-4 mr-1" /> Download Storyboard
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* How to use section */}
        <Card className="mt-6 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">How to use these images</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">In guides:</strong> Download the PNG → upload to GitHub repo (public/images/) → use the URL in your guide Markdown.</p>
            <p><strong className="text-foreground">On social media:</strong> Download the PNG → post directly to Facebook, WhatsApp, LinkedIn, X.</p>
            <p><strong className="text-foreground">As Product of the Day image:</strong> Download the PNG → upload to GitHub → use the URL in the Product of the Day image field.</p>
            <p><strong className="text-foreground">For videos (Campaign Mode):</strong> Generate 3-5 images → add captions → download storyboard → assemble in CapCut or Canva (free video editors).</p>
          </CardContent>
        </Card>
          </>
        )}
      </main>
    </div>
  )
}
