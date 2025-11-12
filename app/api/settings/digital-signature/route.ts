import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { prismaServer as prisma } from "@/lib/prisma-server"

const updateSchema = z.object({
  signatureMode: z.enum(["ORGANIZATION", "PERSONAL"]),
  certificateId: z.string().min(1).optional().nullable(),
  autoSign: z.boolean().optional(),
  notifyOnExpiration: z.boolean().optional(),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: true,
        signatureConfig: {
          include: {
            digitalCertificate: {
              select: {
                id: true,
                subject: true,
                issuer: true,
                validTo: true,
                isActive: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "Usuario sin organización asociada" },
        { status: 400 },
      )
    }

    const certificates = await prisma.digitalCertificate.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        issuer: true,
        validFrom: true,
        validTo: true,
        ruc: true,
      },
    })

    return NextResponse.json({
      config: user.signatureConfig
        ? {
            signatureMode: user.signatureConfig.signatureMode,
            certificateId: user.signatureConfig.digitalCertificateId,
            autoSign: user.signatureConfig.autoSign,
            notifyOnExpiration: user.signatureConfig.notifyOnExpiration,
            certificate:
              user.signatureConfig.digitalCertificate && user.signatureConfig.digitalCertificate.isActive
                ? {
                    id: user.signatureConfig.digitalCertificate.id,
                    subject: user.signatureConfig.digitalCertificate.subject,
                    issuer: user.signatureConfig.digitalCertificate.issuer,
                    validTo: user.signatureConfig.digitalCertificate.validTo,
                  }
                : null,
          }
        : null,
      certificates,
    })
  } catch (error) {
    console.error("[API] Error obteniendo configuración de firma digital:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        organizationId: true,
        organization: { select: { id: true } },
      },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: "Usuario sin organización asociada" },
        { status: 400 },
      )
    }

    let certificateId: string | null = data.certificateId ?? null

    if (data.signatureMode === "PERSONAL") {
      if (!certificateId) {
        return NextResponse.json(
          { error: "Debes seleccionar un certificado válido" },
          { status: 400 },
        )
      }

      const certificate = await prisma.digitalCertificate.findFirst({
        where: {
          id: certificateId,
          organizationId: user.organizationId,
          isActive: true,
        },
      })

      if (!certificate) {
        return NextResponse.json(
          { error: "Certificado no válido o inactivo" },
          { status: 400 },
        )
      }
    } else {
      certificateId = null
    }

    const savedConfig = await prisma.userSignatureConfig.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        organizationId: user.organizationId,
        signatureMode: data.signatureMode,
        digitalCertificateId: certificateId,
        autoSign: data.autoSign ?? true,
        notifyOnExpiration: data.notifyOnExpiration ?? true,
      },
      update: {
        signatureMode: data.signatureMode,
        digitalCertificateId: certificateId,
        autoSign: typeof data.autoSign === "boolean" ? data.autoSign : undefined,
        notifyOnExpiration:
          typeof data.notifyOnExpiration === "boolean" ? data.notifyOnExpiration : undefined,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Configuración de firma digital actualizada",
      config: savedConfig,
    })
  } catch (error) {
    console.error("[API] Error guardando configuración de firma digital:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}

