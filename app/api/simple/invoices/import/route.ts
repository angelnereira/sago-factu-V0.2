import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { OrganizationPlan } from '@prisma/client'
import { parseHKAXmlInvoice } from '@/lib/parsers/hka-invoice-xml'
import { parseCSVInvoice, parseXLSXInvoice } from '@/lib/parsers/spreadsheet-invoice'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isXml(text: string): boolean {
  return /<\?xml|<Invoice|<\w+:Invoice/i.test(text)
}

function getExt(name: string | undefined): string {
  if (!name) return ''
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : ''
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.organization?.plan !== OrganizationPlan.SIMPLE) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    const sendDirectRaw = form.get('sendDirect')
    const sendDirect = String(sendDirectRaw || '').toLowerCase() === 'true'

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido (file)' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo excede 5MB' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const filename = (file as any)?.name as string | undefined
    const ext = getExt(filename)
    const type = (file as any)?.type as string | undefined

    let parsed
    if (ext === 'csv' || type === 'text/csv') {
      parsed = parseCSVInvoice(buf.toString('utf-8'))
    } else if (ext === 'xlsx' || type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      parsed = await parseXLSXInvoice(buf)
    } else {
      const text = buf.toString('utf-8')
      if (!isXml(text)) {
        return NextResponse.json(
          { error: 'Formato no soportado. Sube XML, CSV o XLSX.' },
          { status: 415 },
        )
      }
      parsed = parseHKAXmlInvoice(text)
    }
    if (!parsed.items || parsed.items.length === 0) {
      return NextResponse.json({ error: 'No se detectaron ítems en el XML' }, { status: 422 })
    }

    // Nota: No creamos ni enviamos aquí directamente para evitar duplicar lógica de creación.
    // El cliente puede usar sendDirect=true para que, tras autocompletar, dispare el submit localmente.
    return NextResponse.json({ data: parsed, sendDirect })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error procesando importación' }, { status: 500 })
  }
}


