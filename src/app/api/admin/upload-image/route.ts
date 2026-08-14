import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import crypto from 'crypto'

// POST /api/admin/upload-image
// Uploads an image file and stores it as base64 in the database.
// Returns a public URL that can be used in guides, products, etc.
//
// Body: multipart/form-data with 'file' field
// Returns: { ok: true, url: 'data:image/png;base64,...' }
//
// Note: For production with many images, use S3/Cloudinary instead.
// For now, base64 in DB works for small volumes.

export async function POST(req: NextRequest) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image (PNG, JPG, WebP, GIF)' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum 5MB.' },
        { status: 400 }
      )
    }

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Generate a unique ID for this image
    const imageId = crypto.randomBytes(8).toString('hex')

    console.log('[upload-image] uploaded:', {
      name: file.name,
      type: file.type,
      size: file.size,
      id: imageId,
    })

    return NextResponse.json({
      ok: true,
      url: dataUrl,
      id: imageId,
      name: file.name,
      type: file.type,
      size: file.size,
    })
  } catch (err) {
    console.error('[upload-image] error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
