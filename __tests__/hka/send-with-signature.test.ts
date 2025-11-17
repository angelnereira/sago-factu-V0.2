/**
 * Integration Tests - HKA Send With Signature
 *
 * Tests para la integración de firma digital con HKA
 */

import {
  sendInvoiceWithSignature,
  sendInvoicesBatchWithSignature,
  validateInvoiceReadyToSend,
} from '@/lib/hka/methods/send-with-signature'
import * as invoiceSigner from '@/lib/invoices/invoice-signer'
import * as enviarDocumento from '@/lib/hka/methods/enviar-documento'
import { prismaServer as prisma } from '@/lib/prisma-server'
import { monitorHKACall } from '@/lib/hka/monitoring/call-monitor'

// Mocks
jest.mock('@/lib/invoices/invoice-signer')
jest.mock('@/lib/hka/methods/enviar-documento')
jest.mock('@/lib/prisma-server', () => ({
  prismaServer: {
    invoice: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))
jest.mock('@/lib/hka/monitoring/call-monitor')
jest.mock('@/lib/hka/utils/logger', () => ({
  hkaLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('HKA Send With Signature', () => {
  const mockInvoiceId = 'inv-123'
  const mockOrganizationId = 'org-456'
  const mockCredentials = {
    username: 'testuser',
    password: 'testpass',
  }

  const mockInvoice = {
    id: mockInvoiceId,
    xmlContent: `<?xml version="1.0"?>
<rFE xmlns="http://dgi-fep.mef.gob.pa">
  <dId>FE01PA00001000000000000000000000001</dId>
</rFE>`,
    status: 'DRAFT',
    organization: {
      ruc: '123456789-2-2020',
      dv: '45',
    },
  }

  const mockSignResult = {
    signedXml: `<?xml version="1.0"?>
<rFE xmlns="http://dgi-fep.mef.gob.pa">
  <dId>FE01PA00001000000000000000000000001</dId>
  <ds:Signature>...</ds:Signature>
</rFE>`,
    signature: {
      algorithm: 'RSA-SHA256',
      timestamp: new Date(),
      certificateSubject: 'EMPRESA TEST',
      certificateValidTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      daysUntilExpiration: 365,
    },
    validations: {
      certificateValid: true,
      signatureValid: true,
      rucMatch: true,
    },
  }

  const mockHKAResponse = {
    dCodRes: '0260',
    dMsgRes: 'Factura autorizada',
    dCUFE: 'CUFE123456789',
    dProAut: 'PROTOCOLO123456',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendInvoiceWithSignature', () => {
    it('debe enviar factura sin firmar con firma automática', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(false)
      ;(invoiceSigner.signInvoice as jest.Mock).mockResolvedValue(mockSignResult)
      ;(enviarDocumento.enviarDocumento as jest.Mock).mockResolvedValue(
        mockHKAResponse
      )
      ;(monitorHKACall as jest.Mock).mockImplementation(
        (_name, fn) => fn()
      )

      const result = await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
        autoSign: true,
      })

      expect(result.success).toBe(true)
      expect(result.invoiceId).toBe(mockInvoiceId)
      expect(result.cufe).toBe('CUFE123456789')
      expect(result.protocoloAutorizacion).toBe('PROTOCOLO123456')
      expect(result.signed).toBe(true)
      expect(invoiceSigner.signInvoice).toHaveBeenCalled()
    })

    it('debe enviar factura ya firmada sin firmar de nuevo', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(true)
      ;(enviarDocumento.enviarDocumento as jest.Mock).mockResolvedValue(
        mockHKAResponse
      )
      ;(monitorHKACall as jest.Mock).mockImplementation(
        (_name, fn) => fn()
      )

      const result = await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
        autoSign: true,
      })

      expect(result.success).toBe(true)
      expect(result.signed).toBe(false)
      expect(invoiceSigner.signInvoice).not.toHaveBeenCalled()
    })

    it('debe lanzar error si factura no está firmada y autoSign=false', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(false)

      const result = await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
        autoSign: false,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Factura no está firmada')
    })

    it('debe actualizar DB con XML firmado después de firmar', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(false)
      ;(invoiceSigner.signInvoice as jest.Mock).mockResolvedValue(mockSignResult)
      ;(enviarDocumento.enviarDocumento as jest.Mock).mockResolvedValue(
        mockHKAResponse
      )
      ;(monitorHKACall as jest.Mock).mockImplementation(
        (_name, fn) => fn()
      )

      await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
        autoSign: true,
      })

      // Verificar que se guardó el XML firmado
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockInvoiceId },
          data: expect.objectContaining({
            xmlContent: mockSignResult.signedXml,
            status: 'SIGNED',
            signedAt: expect.any(Date),
          }),
        })
      )
    })

    it('debe actualizar DB con CUFE y protocolo después de enviar a HKA', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(true)
      ;(enviarDocumento.enviarDocumento as jest.Mock).mockResolvedValue(
        mockHKAResponse
      )
      ;(monitorHKACall as jest.Mock).mockImplementation(
        (_name, fn) => fn()
      )

      await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
      })

      // Verificar que se guardó la respuesta de HKA
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockInvoiceId },
          data: expect.objectContaining({
            status: 'AUTHORIZED',
            cufe: 'CUFE123456789',
            authorizationProtocol: 'PROTOCOLO123456',
            sentAt: expect.any(Date),
          }),
        })
      )
    })

    it('debe manejar respuesta de error de HKA', async () => {
      const mockErrorResponse = {
        dCodRes: '0500',
        dMsgRes: 'Error en el servidor',
        dCUFE: '',
        dProAut: '',
      }

      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(true)
      ;(enviarDocumento.enviarDocumento as jest.Mock).mockResolvedValue(
        mockErrorResponse
      )
      ;(monitorHKACall as jest.Mock).mockImplementation(
        (_name, fn) => fn()
      )

      const result = await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('0500')
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ERROR',
          }),
        })
      )
    })

    it('debe retornar error si factura no existe', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await sendInvoiceWithSignature({
        invoiceId: 'nonexistent',
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Factura no encontrada')
    })

    it('debe retornar error si factura sin XML', async () => {
      const invoiceWithoutXml = {
        ...mockInvoice,
        xmlContent: null,
      }
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(
        invoiceWithoutXml
      )

      const result = await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('XML')
    })

    it('debe reintentar en caso de timeout de red', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(true)

      // Primera llamada falla con timeout, segunda exitosa
      ;(monitorHKACall as jest.Mock)
        .mockImplementationOnce(() => {
          throw new Error('timeout')
        })
        .mockImplementationOnce((_name, fn) => fn())

      ;(enviarDocumento.enviarDocumento as jest.Mock).mockResolvedValue(
        mockHKAResponse
      )

      const result = await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
        maxRetries: 3,
      })

      expect(result.success).toBe(true)
      expect(monitorHKACall).toHaveBeenCalledTimes(2)
    })

    it('debe fallar después de agotar reintentos', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(true)
      ;(monitorHKACall as jest.Mock).mockImplementation(() => {
        throw new Error('ECONNREFUSED')
      })

      const result = await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
        maxRetries: 2,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('ECONNREFUSED')
    })

    it('debe pasar RUC a signInvoice si validateRuc=true', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(false)
      ;(invoiceSigner.signInvoice as jest.Mock).mockResolvedValue(mockSignResult)
      ;(enviarDocumento.enviarDocumento as jest.Mock).mockResolvedValue(
        mockHKAResponse
      )
      ;(monitorHKACall as jest.Mock).mockImplementation(
        (_name, fn) => fn()
      )

      await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
        validateRuc: true,
      })

      expect(invoiceSigner.signInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          ruc: '123456789-2-2020',
        })
      )
    })

    it('debe no pasar RUC a signInvoice si validateRuc=false', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(false)
      ;(invoiceSigner.signInvoice as jest.Mock).mockResolvedValue(mockSignResult)
      ;(enviarDocumento.enviarDocumento as jest.Mock).mockResolvedValue(
        mockHKAResponse
      )
      ;(monitorHKACall as jest.Mock).mockImplementation(
        (_name, fn) => fn()
      )

      await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
        validateRuc: false,
      })

      expect(invoiceSigner.signInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          ruc: undefined,
        })
      )
    })
  })

  describe('sendInvoicesBatchWithSignature', () => {
    it('debe enviar múltiples facturas en lote', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(true)
      ;(enviarDocumento.enviarDocumento as jest.Mock).mockResolvedValue(
        mockHKAResponse
      )
      ;(monitorHKACall as jest.Mock).mockImplementation(
        (_name, fn) => fn()
      )

      const result = await sendInvoicesBatchWithSignature(
        [mockInvoiceId, 'inv-124', 'inv-125'],
        {
          credentials: mockCredentials,
          organizationId: mockOrganizationId,
          certificateBase64: 'base64cert',
          certificatePassword: 'certpass',
        }
      )

      expect(result).toHaveLength(3)
      expect(result.every((r) => r.success === true)).toBe(true)
    })

    it('debe continuar si una factura falla', async () => {
      ;(prisma.invoice.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockInvoice)
        .mockResolvedValueOnce(null) // Segunda factura no existe
        .mockResolvedValueOnce(mockInvoice)

      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(true)
      ;(enviarDocumento.enviarDocumento as jest.Mock).mockResolvedValue(
        mockHKAResponse
      )
      ;(monitorHKACall as jest.Mock).mockImplementation(
        (_name, fn) => fn()
      )

      const result = await sendInvoicesBatchWithSignature(
        [mockInvoiceId, 'inv-124', 'inv-125'],
        {
          credentials: mockCredentials,
          organizationId: mockOrganizationId,
          certificateBase64: 'base64cert',
          certificatePassword: 'certpass',
        }
      )

      expect(result).toHaveLength(3)
      expect(result[0].success).toBe(true)
      expect(result[1].success).toBe(false)
      expect(result[2].success).toBe(true)
    })

    it('debe retornar mezcla de éxitos y errores', async () => {
      ;(prisma.invoice.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockInvoice)
        .mockResolvedValueOnce(mockInvoice)

      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(true)
      ;(enviarDocumento.enviarDocumento as jest.Mock)
        .mockResolvedValueOnce(mockHKAResponse)
        .mockResolvedValueOnce({
          dCodRes: '0500',
          dMsgRes: 'Error',
          dCUFE: '',
          dProAut: '',
        })

      ;(monitorHKACall as jest.Mock).mockImplementation(
        (_name, fn) => fn()
      )

      const result = await sendInvoicesBatchWithSignature(
        ['inv-123', 'inv-124'],
        {
          credentials: mockCredentials,
          organizationId: mockOrganizationId,
          certificateBase64: 'base64cert',
          certificatePassword: 'certpass',
        }
      )

      expect(result[0].success).toBe(true)
      expect(result[1].success).toBe(false)
    })
  })

  describe('validateInvoiceReadyToSend', () => {
    it('debe validar que factura está lista para enviar', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        xmlContent: mockInvoice.xmlContent,
        status: 'DRAFT',
        cufe: null,
      })
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(true)

      const result = await validateInvoiceReadyToSend(
        mockInvoiceId,
        mockOrganizationId
      )

      expect(result.valid).toBe(true)
      expect(result.messages).toHaveLength(0)
    })

    it('debe alertar si factura no está firmada', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        xmlContent: mockInvoice.xmlContent,
        status: 'DRAFT',
        cufe: null,
      })
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(false)

      const result = await validateInvoiceReadyToSend(
        mockInvoiceId,
        mockOrganizationId
      )

      expect(result.messages.some((m) => m.includes('no está firmada'))).toBe(
        true
      )
    })

    it('debe alertar si factura fue enviada previamente', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        xmlContent: mockInvoice.xmlContent,
        status: 'AUTHORIZED',
        cufe: 'CUFE123',
      })
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(true)

      const result = await validateInvoiceReadyToSend(
        mockInvoiceId,
        mockOrganizationId
      )

      expect(result.valid).toBe(false)
      expect(result.messages.some((m) => m.includes('ya fue enviada'))).toBe(
        true
      )
    })

    it('debe retornar error si factura no existe', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await validateInvoiceReadyToSend(
        'nonexistent',
        mockOrganizationId
      )

      expect(result.valid).toBe(false)
      expect(result.messages.some((m) => m.includes('no encontrada'))).toBe(
        true
      )
    })

    it('debe retornar error si factura sin XML', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        xmlContent: null,
        status: 'DRAFT',
        cufe: null,
      })

      const result = await validateInvoiceReadyToSend(
        mockInvoiceId,
        mockOrganizationId
      )

      expect(result.valid).toBe(false)
      expect(result.messages.some((m) => m.includes('XML'))).toBe(true)
    })
  })

  describe('Manejo de errores', () => {
    it('debe capturar y loggear errores de firma', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(false)
      ;(invoiceSigner.signInvoice as jest.Mock).mockRejectedValue(
        new Error('Contraseña incorrecta')
      )

      const result = await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'wrongpass',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Contraseña incorrecta')
    })

    it('debe actualizar status a ERROR en DB cuando falla', async () => {
      ;(prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice)
      ;(invoiceSigner.isAlreadySigned as jest.Mock).mockReturnValue(false)
      ;(invoiceSigner.signInvoice as jest.Mock).mockRejectedValue(
        new Error('Certificado vencido')
      )

      await sendInvoiceWithSignature({
        invoiceId: mockInvoiceId,
        credentials: mockCredentials,
        organizationId: mockOrganizationId,
        certificateBase64: 'base64cert',
        certificatePassword: 'certpass',
      })

      // Verificar que se guardó el error en BD
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ERROR',
            errorMessage: expect.any(String),
          }),
        })
      )
    })
  })
})
