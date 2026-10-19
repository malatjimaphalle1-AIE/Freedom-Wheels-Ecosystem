import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// PATCH — update product
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError
  const { id } = await params
  try {
    const body = await req.json()
    const updated = await db.digitalProduct.update({ where: { id }, data: body })
    return NextResponse.json({ ok: true, product: updated })
  } catch (err) {
    console.error('[admin/digital-products PATCH] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError
  const { id } = await params
  try {
    await db.digitalProduct.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/digital-products DELETE] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
