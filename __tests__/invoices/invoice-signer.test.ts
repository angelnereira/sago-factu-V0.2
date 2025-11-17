/**
 * Unit Tests - Invoice Signer Service
 *
 * Tests para el servicio de firma de facturas electrónicas
 */

import {
  signInvoice,
  signInvoiceAdvanced,
  loadInvoiceCertificate,
  isAlreadySigned,
  getCertificateInfo,
} from '@/lib/invoices/invoice-signer'
import * as certificateManager from '@/lib/certificates/certificate-manager'

// Mock the certificate manager module
jest.mock('@/lib/certificates/certificate-manager')
jest.mock('@/lib/hka/utils/logger', () => ({
  hkaLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('Invoice Signer Service', () => {
  // Mock data
  const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
<rFE xmlns="http://dgi-fep.mef.gob.pa">
  <dVerForm>1.00</dVerForm>
  <dId>FE01PA00001000000000000000000000001</dId>
  <gDGen>
    <dFecEmi>2025-11-17</dFecEmi>
    <dHoraEmi>14:30:00</dHoraEmi>
  </gDGen>
</rFE>`

  const mockCertificate = {
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
-----END PRIVATE KEY-----`,
    certificate: `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUc0A0BwhKaFU8yAR+T7K+K8K8K8GwYDVR0jBCgwJoAkB
-----END CERTIFICATE-----`,
    certificateChain: [
      `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUc0A0BwhKaFU8yAR
-----END CERTIFICATE-----`,
    ],
    subject: {
      cn: 'EMPRESA TEST RUC=123456789-2-2020 DV=45',
      o: 'EMPRESA TEST S.A.',
      c: 'PA',
    },
    issuer: {
      cn: 'DGI Test CA',
      o: 'DGI Panama',
      c: 'PA',
    },
    validFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    ruc: '123456789-2-2020',
    dv: '45',
    fingerprint: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  }

  const mockSignedXML = `<?xml version="1.0" encoding="UTF-8"?>
<rFE xmlns="http://dgi-fep.mef.gob.pa">
  <dVerForm>1.00</dVerForm>
  <dId>FE01PA00001000000000000000000000001</dId>
  <gDGen>
    <dFecEmi>2025-11-17</dFecEmi>
    <dHoraEmi>14:30:00</dHoraEmi>
  </gDGen>
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
      <ds:Reference URI="">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>abc123==</ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>xyz789==</ds:SignatureValue>
    <ds:KeyInfo>
      <ds:X509Data>
        <ds:X509Certificate>MIID...</ds:X509Certificate>
      </ds:X509Data>
    </ds:KeyInfo>
  </ds:Signature>
</rFE>`

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('loadInvoiceCertificate', () => {
    it('debe cargar certificado desde archivo', async () => {
      ;(
        certificateManager.loadCertificateFromFile as jest.Mock
      ).mockReturnValue(mockCertificate)

      const result = await loadInvoiceCertificate(
        '/path/to/cert.p12',
        undefined,
        'password'
      )

      expect(result).toEqual(mockCertificate)
      expect(
        certificateManager.loadCertificateFromFile
      ).toHaveBeenCalledWith('/path/to/cert.p12', 'password')
    })

    it('debe cargar certificado desde base64', async () => {
      ;(
        certificateManager.loadCertificateFromBase64 as jest.Mock
      ).mockReturnValue(mockCertificate)

      const result = await loadInvoiceCertificate(
        undefined,
        'base64encodedcert',
        'password'
      )

      expect(result).toEqual(mockCertificate)
      expect(
        certificateManager.loadCertificateFromBase64
      ).toHaveBeenCalledWith('base64encodedcert', 'password')
    })

    it('debe lanzar error si no se proporciona contraseña', async () => {
      await expect(
        loadInvoiceCertificate('/path/to/cert.p12', undefined, undefined)
      ).rejects.toThrow('Se requiere contraseña del certificado')
    })

    it('debe lanzar error si no se proporciona certificatePath ni certificateBase64', async () => {
      await expect(
        loadInvoiceCertificate(undefined, undefined, 'password')
      ).rejects.toThrow('Se requiere certificatePath o certificateBase64')
    })

    it('debe propagar error del certificate manager', async () => {
      ;(
        certificateManager.loadCertificateFromFile as jest.Mock
      ).mockImplementation(() => {
        throw new Error('Archivo no encontrado')
      })

      await expect(
        loadInvoiceCertificate('/path/to/cert.p12', undefined, 'password')
      ).rejects.toThrow('Error cargando certificado: Archivo no encontrado')
    })
  })

  describe('signInvoice', () => {
    beforeEach(() => {
      ;(
        certificateManager.loadCertificateFromBase64 as jest.Mock
      ).mockReturnValue(mockCertificate)
      ;(certificateManager.validateCertificate as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      })
      ;(certificateManager.getDaysUntilExpiration as jest.Mock).mockReturnValue(
        300
      )
      ;(certificateManager.willExpireSoon as jest.Mock).mockReturnValue(false)
    })

    it('debe firmar una factura válida exitosamente', async () => {
      const result = await signInvoice({
        xmlFactura: mockXML,
        certificateBase64: 'base64cert',
        password: 'password',
      })

      expect(result.success).toBeUndefined() // No existe propiedad success en resultado
      expect(result.signedXml).toBeTruthy()
      expect(result.signature).toBeTruthy()
      expect(result.signature.algorithm).toBe('RSA-SHA256')
      expect(result.signature.timestamp instanceof Date).toBe(true)
      expect(result.signature.certificateSubject).toBeTruthy()
      expect(result.signature.daysUntilExpiration).toBeGreaterThan(0)
    })

    it('debe incluir validaciones en resultado', async () => {
      const result = await signInvoice({
        xmlFactura: mockXML,
        certificateBase64: 'base64cert',
        password: 'password',
      })

      expect(result.validations).toBeTruthy()
      expect(result.validations.certificateValid).toBe(true)
      expect(typeof result.validations.signatureValid).toBe('boolean')
      expect(typeof result.validations.rucMatch).toBe('boolean')
    })

    it('debe validar certificado válido', async () => {
      ;(certificateManager.validateCertificate as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      })

      const result = await signInvoice({
        xmlFactura: mockXML,
        certificateBase64: 'base64cert',
        password: 'password',
      })

      expect(result.validations.certificateValid).toBe(true)
    })

    it('debe rechazar certificado inválido', async () => {
      ;(certificateManager.validateCertificate as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Certificado vencido', 'RUC no coincide'],
      })

      await expect(
        signInvoice({
          xmlFactura: mockXML,
          certificateBase64: 'base64cert',
          password: 'password',
        })
      ).rejects.toThrow('Certificado inválido: Certificado vencido; RUC no coincide')
    })

    it('debe advertir si certificado expira pronto pero no fallar', async () => {
      ;(certificateManager.willExpireSoon as jest.Mock).mockReturnValue(true)
      ;(certificateManager.getDaysUntilExpiration as jest.Mock).mockReturnValue(
        5
      )

      const result = await signInvoice({
        xmlFactura: mockXML,
        certificateBase64: 'base64cert',
        password: 'password',
        validateExpiration: true,
      })

      expect(result.signature.daysUntilExpiration).toBe(5)
    })

    it('debe lanzar error si certificado está vencido', async () => {
      ;(certificateManager.willExpireSoon as jest.Mock).mockReturnValue(true)
      ;(certificateManager.getDaysUntilExpiration as jest.Mock).mockReturnValue(
        -1
      )

      await expect(
        signInvoice({
          xmlFactura: mockXML,
          certificateBase64: 'base64cert',
          password: 'password',
          validateExpiration: true,
        })
      ).rejects.toThrow('Certificado expira en -1 días')
    })

    it('debe validar RUC si se proporciona', async () => {
      await signInvoice({
        xmlFactura: mockXML,
        certificateBase64: 'base64cert',
        password: 'password',
        ruc: '123456789-2-2020',
      })

      expect(certificateManager.validateCertificate).toHaveBeenCalledWith(
        mockCertificate,
        '123456789-2-2020'
      )
    })

    it('debe saltarse validación de vigencia si validateExpiration=false', async () => {
      await signInvoice({
        xmlFactura: mockXML,
        certificateBase64: 'base64cert',
        password: 'password',
        validateExpiration: false,
      })

      expect(certificateManager.willExpireSoon).not.toHaveBeenCalled()
    })
  })

  describe('signInvoiceAdvanced', () => {
    beforeEach(() => {
      ;(
        certificateManager.loadCertificateFromBase64 as jest.Mock
      ).mockReturnValue(mockCertificate)
      ;(certificateManager.validateCertificate as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      })
      ;(certificateManager.getDaysUntilExpiration as jest.Mock).mockReturnValue(
        300
      )
    })

    it('debe permitir algoritmos personalizados', async () => {
      const result = await signInvoiceAdvanced({
        xmlFactura: mockXML,
        certificateBase64: 'base64cert',
        password: 'password',
        signatureAlgorithm:
          'http://www.w3.org/2001/04/xmldsig-more#rsa-sha512',
        canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha512',
      })

      expect(result.signature.algorithm).toBe('RSA-SHA256 (Custom)')
      expect(result.signedXml).toBeTruthy()
    })

    it('debe usar algoritmos por defecto si no se especifican', async () => {
      const result = await signInvoiceAdvanced({
        xmlFactura: mockXML,
        certificateBase64: 'base64cert',
        password: 'password',
      })

      expect(result.signature.algorithm).toBe('RSA-SHA256 (Custom)')
    })

    it('debe rechazar certificado inválido', async () => {
      ;(certificateManager.validateCertificate as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Certificado vencido'],
      })

      await expect(
        signInvoiceAdvanced({
          xmlFactura: mockXML,
          certificateBase64: 'base64cert',
          password: 'password',
        })
      ).rejects.toThrow('Certificado vencido')
    })
  })

  describe('isAlreadySigned', () => {
    it('debe detectar Signature element', () => {
      expect(isAlreadySigned(mockSignedXML)).toBe(true)
    })

    it('debe detectar ds:Signature element', () => {
      const xmlWithDsSignature = mockXML.replace(
        '</rFE>',
        '<ds:Signature></ds:Signature></rFE>'
      )
      expect(isAlreadySigned(xmlWithDsSignature)).toBe(true)
    })

    it('debe retornar false si XML no está firmado', () => {
      expect(isAlreadySigned(mockXML)).toBe(false)
    })

    it('debe ser case-sensitive', () => {
      const xmlWithLowercase = mockXML.replace('</rFE>', '<signature></signature></rFE>')
      expect(isAlreadySigned(xmlWithLowercase)).toBe(false)
    })
  })

  describe('getCertificateInfo', () => {
    beforeEach(() => {
      ;(
        certificateManager.loadCertificateFromBase64 as jest.Mock
      ).mockReturnValue(mockCertificate)
      ;(certificateManager.getDaysUntilExpiration as jest.Mock).mockReturnValue(
        300
      )
    })

    it('debe retornar información del certificado', async () => {
      const result = await getCertificateInfo(
        undefined,
        'base64cert',
        'password'
      )

      expect(result.subject).toBeTruthy()
      expect(result.issuer).toBeTruthy()
      expect(result.validFrom instanceof Date).toBe(true)
      expect(result.validTo instanceof Date).toBe(true)
      expect(result.daysUntilExpiration).toBeGreaterThan(0)
      expect(result.ruc).toBe('123456789-2-2020')
      expect(result.fingerprint).toBeTruthy()
    })

    it('debe incluir RUC si está disponible', async () => {
      const result = await getCertificateInfo(
        undefined,
        'base64cert',
        'password'
      )

      expect(result.ruc).toBe(mockCertificate.ruc)
    })

    it('debe retornar "Unknown" para sujeto e issuer si no están disponibles', async () => {
      const certWithoutNames = {
        ...mockCertificate,
        subject: { cn: undefined },
        issuer: { cn: undefined },
      }
      ;(
        certificateManager.loadCertificateFromBase64 as jest.Mock
      ).mockReturnValue(certWithoutNames)

      const result = await getCertificateInfo(
        undefined,
        'base64cert',
        'password'
      )

      expect(result.subject).toBe('Unknown')
      expect(result.issuer).toBe('Unknown')
    })

    it('debe cargar desde archivo si se proporciona ruta', async () => {
      await getCertificateInfo('/path/to/cert.p12', undefined, 'password')

      expect(
        certificateManager.loadCertificateFromFile
      ).toHaveBeenCalledWith('/path/to/cert.p12', 'password')
    })
  })

  describe('Flujo completo de firma', () => {
    beforeEach(() => {
      ;(
        certificateManager.loadCertificateFromBase64 as jest.Mock
      ).mockReturnValue(mockCertificate)
      ;(certificateManager.validateCertificate as jest.Mock).mockReturnValue({
        valid: true,
        errors: [],
      })
      ;(certificateManager.getDaysUntilExpiration as jest.Mock).mockReturnValue(
        300
      )
      ;(certificateManager.willExpireSoon as jest.Mock).mockReturnValue(false)
    })

    it('debe completar el flujo: cargar → validar → firmar → retornar', async () => {
      const result = await signInvoice({
        xmlFactura: mockXML,
        certificateBase64: 'base64cert',
        password: 'password',
        ruc: '123456789-2-2020',
        validateExpiration: true,
      })

      // Verificar que pasó por todas las etapas
      expect(certificateManager.loadCertificateFromBase64).toHaveBeenCalled()
      expect(certificateManager.validateCertificate).toHaveBeenCalled()
      expect(certificateManager.willExpireSoon).toHaveBeenCalled()

      // Verificar resultado
      expect(result.signedXml).toBeTruthy()
      expect(result.signature).toBeTruthy()
      expect(result.validations).toBeTruthy()
      expect(result.validations.certificateValid).toBe(true)
    })

    it('debe manejar errores en cualquier etapa del flujo', async () => {
      ;(certificateManager.validateCertificate as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Certificado vencido'],
      })

      await expect(
        signInvoice({
          xmlFactura: mockXML,
          certificateBase64: 'base64cert',
          password: 'password',
        })
      ).rejects.toThrow()

      // El resto de validaciones no deberían ejecutarse
      expect(certificateManager.willExpireSoon).not.toHaveBeenCalled()
    })
  })

  describe('Manejo de errores', () => {
    it('debe propagar error si certificado manager falla', async () => {
      ;(
        certificateManager.loadCertificateFromBase64 as jest.Mock
      ).mockImplementation(() => {
        throw new Error('Error decodificando base64')
      })

      await expect(
        signInvoice({
          xmlFactura: mockXML,
          certificateBase64: 'invalid',
          password: 'password',
        })
      ).rejects.toThrow('Error firmando factura: Error decodificando base64')
    })

    it('debe incluir mensaje de error descriptivo', async () => {
      ;(
        certificateManager.loadCertificateFromBase64 as jest.Mock
      ).mockImplementation(() => {
        throw new Error('Contraseña incorrecta')
      })

      try {
        await signInvoice({
          xmlFactura: mockXML,
          certificateBase64: 'base64cert',
          password: 'wrongpassword',
        })
      } catch (error) {
        expect((error as Error).message).toContain('Contraseña incorrecta')
      }
    })
  })
})
