import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { db } from '@/lib/db'

// PATCH /api/admin/ai-tools/{id}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError
  const { id } = await params
  try {
    const body = await req.json()
    const updated = await db.aiTool.update({ where: { id }, data: body })
    return NextResponse.json({ ok: true, tool: updated })
  } catch (err) {
    console.error('[admin/ai-tools PATCH] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/ai-tools/{id}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAdminAuth(req)
  if (authError) return authError
  const { id } = await params
  try {
    await db.aiTool.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/ai-tools DELETE] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
