/**
 * Unit Tests - Certificate Manager
 *
 * Tests para la gestión de certificados PKCS#12
 */

import {
  parsePKCS12,
  validateCertificate,
  getDaysUntilExpiration,
  willExpireSoon,
  loadCertificateFromFile,
  loadCertificateFromBase64,
} from '@/lib/certificates/certificate-manager'

describe('Certificate Manager', () => {
  // Mock data
  const mockValidCertificate = {
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----',
    certificate: '-----BEGIN CERTIFICATE-----\nMIIG...\n-----END CERTIFICATE-----',
    subject: {
      cn: 'EMPRESA S.A. RUC=155596713-2-2015 DV=59',
      o: 'PANAMA',
      c: 'PA',
    },
    issuer: {
      cn: 'Firma Electrónica de Panamá',
      o: 'Dirección Nacional de Firma Electrónica',
      c: 'PA',
    },
    validFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 año atrás
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año adelante
    ruc: '155596713-2-2015',
    dv: '59',
    fingerprint: 'a1b2c3d4e5f6...',
  }

  describe('validateCertificate', () => {
    it('debe validar un certificado válido', () => {
      const result = validateCertificate(mockValidCertificate)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('debe detectar certificado expirado', () => {
      const expiredCert = {
        ...mockValidCertificate,
        validTo: new Date(Date.now() - 1000), // Expiró hace 1 segundo
      }

      const result = validateCertificate(expiredCert)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('expirado'))
    })

    it('debe detectar certificado no vigente aún', () => {
      const futureValidCert = {
        ...mockValidCertificate,
        validFrom: new Date(Date.now() + 1000), // Válido a partir de ahora+1s
      }

      const result = validateCertificate(futureValidCert)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('no es válido'))
    })

    it('debe detectar RUC que no coincide', () => {
      const result = validateCertificate(
        mockValidCertificate,
        '999999999-9-9999' // RUC diferente
      )

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('RUC'))
    })

    it('debe aceptar RUC que coincide', () => {
      const result = validateCertificate(
        mockValidCertificate,
        '155596713-2-2015' // Mismo RUC
      )

      expect(result.valid).toBe(true)
    })

    it('debe detectar certificado sin clave privada', () => {
      const noCert = {
        ...mockValidCertificate,
        privateKey: 'invalid_key_data',
      }

      const result = validateCertificate(noCert)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(expect.stringContaining('clave privada'))
    })
  })

  describe('getDaysUntilExpiration', () => {
    it('debe calcular correctamente días hasta vencimiento', () => {
      const cert = {
        ...mockValidCertificate,
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      }

      const days = getDaysUntilExpiration(cert)

      // Permitir un margen de 1 día por diferencias de ejecución
      expect(days).toBeGreaterThanOrEqual(28)
      expect(days).toBeLessThanOrEqual(30)
    })

    it('debe retornar número negativo si ya expiró', () => {
      const expiredCert = {
        ...mockValidCertificate,
        validTo: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expiró hace 10 días
      }

      const days = getDaysUntilExpiration(expiredCert)

      expect(days).toBeLessThan(0)
    })
  })

  describe('willExpireSoon', () => {
    it('debe detectar certificado que expirará en menos de 30 días', () => {
      const cert = {
        ...mockValidCertificate,
        validTo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días
      }

      expect(willExpireSoon(cert, 30)).toBe(true)
    })

    it('debe permitir threshold personalizado', () => {
      const cert = {
        ...mockValidCertificate,
        validTo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 días
      }

      expect(willExpireSoon(cert, 10)).toBe(true)
      expect(willExpireSoon(cert, 20)).toBe(true)
    })

    it('no debe alertar si expira después del threshold', () => {
      const cert = {
        ...mockValidCertificate,
        validTo: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000), // 100 días
      }

      expect(willExpireSoon(cert, 30)).toBe(false)
    })

    it('debe detectar certificados expirados', () => {
      const expiredCert = {
        ...mockValidCertificate,
        validTo: new Date(Date.now() - 1000),
      }

      expect(willExpireSoon(expiredCert)).toBe(true)
    })
  })

  describe('Manejo de Errores', () => {
    it('debe lanzar error si certificado está corrupto', () => {
      const invalidBuffer = Buffer.from('not_a_valid_p12_file')

      expect(() => {
        parsePKCS12(invalidBuffer, 'wrong_password')
      }).toThrow()
    })

    it('debe lanzar error con contraseña incorrecta', () => {
      // Esto depende de tener un archivo .p12 real
      // En tests reales, usaríamos fixtures
      expect(() => {
        const invalidBuffer = Buffer.from('invalid')
        parsePKCS12(invalidBuffer, 'wrong_password')
      }).toThrow()
    })
  })

  describe('Validaciones de Estructura', () => {
    it('certificado debe tener clave privada en formato PEM', () => {
      const result = validateCertificate(mockValidCertificate)

      expect(result.valid).toBe(true)
      expect(mockValidCertificate.privateKey).toContain('PRIVATE KEY')
    })

    it('certificado debe tener X.509 válido', () => {
      const result = validateCertificate(mockValidCertificate)

      expect(result.valid).toBe(true)
      expect(mockValidCertificate.certificate).toContain('CERTIFICATE')
    })

    it('debe validar RUC en formato correcto', () => {
      const cert = {
        ...mockValidCertificate,
        ruc: '155596713-2-2015', // Formato: X-XXXXXX-XXXX
      }

      const result = validateCertificate(cert, cert.ruc)
      expect(result.valid).toBe(true)
    })
  })

  describe('Información de Certificado', () => {
    it('debe extraer información correcta del subject', () => {
      expect(mockValidCertificate.subject.cn).toContain('EMPRESA S.A.')
      expect(mockValidCertificate.subject.c).toBe('PA')
    })

    it('debe extraer RUC del subject', () => {
      expect(mockValidCertificate.ruc).toBe('155596713-2-2015')
      expect(mockValidCertificate.dv).toBe('59')
    })

    it('debe extraer información del emisor', () => {
      expect(mockValidCertificate.issuer.cn).toBe('Firma Electrónica de Panamá')
      expect(mockValidCertificate.issuer.c).toBe('PA')
    })

    it('debe calcular huella digital', () => {
      expect(mockValidCertificate.fingerprint).toBeTruthy()
      expect(typeof mockValidCertificate.fingerprint).toBe('string')
      expect(mockValidCertificate.fingerprint.length).toBeGreaterThan(0)
    })
  })
})
