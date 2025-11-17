/**
 * Certificate Expiration Alerts
 *
 * Sistema automático para enviar alertas por email cuando los certificados
 * están próximos a vencer
 */

import { prismaServer as prisma } from '@/lib/prisma-server'
import { hkaLogger } from '@/lib/hka/utils/logger'
import { sendEmail } from '@/lib/email/send-email'

/**
 * Alertas configurables
 */
const ALERT_THRESHOLDS = {
  URGENT: 7, // Menos de 7 días = urgente
  WARNING: 30, // Menos de 30 días = advertencia
  INFO: 60, // Menos de 60 días = informativo
}

interface CertificateAlert {
  organizationId: string
  organizationName: string
  userEmails: string[]
  certificates: Array<{
    id: string
    name: string
    daysUntilExpiration: number
    validTo: Date
  }>
}

/**
 * Obtiene todos los certificados que necesitan alertas
 */
export async function checkCertificateExpiration(): Promise<CertificateAlert[]> {
  try {
    hkaLogger.info('[CertificateAlerts] Iniciando verificación de vencimientos')

    const now = new Date()
    const alerts: CertificateAlert[] = []

    // Obtener todas las organizaciones con certificados próximos a vencer
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        users: {
          select: {
            email: true,
            role: true,
          },
          where: {
            role: 'ADMIN', // Solo notificar a administradores
          },
        },
        digitalCertificates: {
          select: {
            id: true,
            name: true,
            validTo: true,
            isActive: true,
          },
          where: {
            isActive: true,
          },
        },
      },
    })

    for (const org of organizations) {
      const certificatesToAlert: CertificateAlert['certificates'] = []

      for (const cert of org.digitalCertificates) {
        const daysUntilExpiration = Math.floor(
          (cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Si vence en menos de 60 días, agregar a alertas
        if (daysUntilExpiration < ALERT_THRESHOLDS.INFO) {
          certificatesToAlert.push({
            id: cert.id,
            name: cert.name,
            daysUntilExpiration: Math.max(0, daysUntilExpiration),
            validTo: cert.validTo,
          })
        }
      }

      // Si hay certificados para alertar, agregar a la lista
      if (certificatesToAlert.length > 0 && org.users.length > 0) {
        alerts.push({
          organizationId: org.id,
          organizationName: org.name,
          userEmails: org.users.map((u) => u.email),
          certificates: certificatesToAlert.sort(
            (a, b) => a.daysUntilExpiration - b.daysUntilExpiration
          ),
        })
      }
    }

    hkaLogger.info('[CertificateAlerts] Verificación completada', {
      organizationsWithAlerts: alerts.length,
      totalCertificates: alerts.reduce((sum, a) => sum + a.certificates.length, 0),
    })

    return alerts
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    hkaLogger.error('[CertificateAlerts] Error verificando certificados:', {
      error: errorMsg,
    })
    return []
  }
}

/**
 * Envía alertas por email para certificados próximos a vencer
 */
export async function sendCertificateExpirationAlerts(): Promise<void> {
  try {
    hkaLogger.info('[CertificateAlerts] Enviando alertas de vencimiento')

    const alerts = await checkCertificateExpiration()

    for (const alert of alerts) {
      for (const email of alert.userEmails) {
        try {
          await sendCertificateAlertEmail(email, alert)
        } catch (error) {
          hkaLogger.error('[CertificateAlerts] Error enviando email a ' + email, {
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }

    hkaLogger.info('[CertificateAlerts] Alertas enviadas', {
      totalEmails: alerts.reduce((sum, a) => sum + a.userEmails.length, 0),
    })
  } catch (error) {
    hkaLogger.error('[CertificateAlerts] Error en envío de alertas:', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Construye y envía un email de alerta de certificado
 */
async function sendCertificateAlertEmail(
  email: string,
  alert: CertificateAlert
): Promise<void> {
  // Agrupar certificados por nivel de urgencia
  const urgent = alert.certificates.filter(
    (c) => c.daysUntilExpiration <= ALERT_THRESHOLDS.URGENT
  )
  const warnings = alert.certificates.filter(
    (c) =>
      c.daysUntilExpiration > ALERT_THRESHOLDS.URGENT &&
      c.daysUntilExpiration <= ALERT_THRESHOLDS.WARNING
  )
  const infos = alert.certificates.filter(
    (c) =>
      c.daysUntilExpiration > ALERT_THRESHOLDS.WARNING &&
      c.daysUntilExpiration <= ALERT_THRESHOLDS.INFO
  )

  const subject =
    urgent.length > 0
      ? `⚠️ URGENTE: Certificados digitales por vencer en ${alert.organizationName}`
      : warnings.length > 0
        ? `⏰ Alerta: Certificados digitales próximos a vencer en ${alert.organizationName}`
        : `ℹ️ Información: Certificados digitales con vencimiento próximo en ${alert.organizationName}`

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .cert-item { padding: 15px; border-left: 4px solid #667eea; background: #f9f9f9; margin-bottom: 10px; border-radius: 4px; }
        .cert-item.urgent { border-left-color: #dc2626; background: #fee2e2; }
        .cert-item.warning { border-left-color: #f59e0b; background: #fef3c7; }
        .cert-item.info { border-left-color: #3b82f6; background: #eff6ff; }
        .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject}</h1>
          <p>Fecha: ${new Date().toLocaleDateString('es-PA')}</p>
        </div>

        <div class="section">
          <p>Hola,</p>
          <p>
            Se ha detectado que tu organización <strong>${alert.organizationName}</strong>
            tiene certificados digitales próximos a vencer.
          </p>
        </div>

        ${
          urgent.length > 0
            ? `
          <div class="section">
            <h2 style="color: #dc2626;">⚠️ CERTIFICADOS VENCIDOS O POR VENCER URGENTEMENTE</h2>
            ${urgent
              .map(
                (cert) => `
              <div class="cert-item urgent">
                <strong>${cert.name}</strong><br>
                <span style="color: #dc2626; font-weight: bold;">
                  ${cert.daysUntilExpiration <= 0 ? 'VENCIDO' : `Vence en ${cert.daysUntilExpiration} días`}
                </span><br>
                Fecha de vencimiento: ${cert.validTo.toLocaleDateString('es-PA')}
              </div>
            `
              )
              .join('')}
            <p style="color: #dc2626; font-weight: bold;">
              ¡ACCIÓN INMEDIATA REQUERIDA! Carga un nuevo certificado inmediatamente para continuar firmando facturas.
            </p>
          </div>
        `
            : ''
        }

        ${
          warnings.length > 0
            ? `
          <div class="section">
            <h2 style="color: #f59e0b;">⏰ CERTIFICADOS POR VENCER PRÓXIMAMENTE</h2>
            ${warnings
              .map(
                (cert) => `
              <div class="cert-item warning">
                <strong>${cert.name}</strong><br>
                Vence en ${cert.daysUntilExpiration} días<br>
                Fecha de vencimiento: ${cert.validTo.toLocaleDateString('es-PA')}
              </div>
            `
              )
              .join('')}
            <p>Considera cargar un nuevo certificado en los próximos días.</p>
          </div>
        `
            : ''
        }

        ${
          infos.length > 0
            ? `
          <div class="section">
            <h2 style="color: #3b82f6;">ℹ️ INFORMACIÓN: CERTIFICADOS CON VENCIMIENTO PRÓXIMO</h2>
            ${infos
              .map(
                (cert) => `
              <div class="cert-item info">
                <strong>${cert.name}</strong><br>
                Vence en ${cert.daysUntilExpiration} días<br>
                Fecha de vencimiento: ${cert.validTo.toLocaleDateString('es-PA')}
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        <div class="section">
          <p>Para gestionar tus certificados, accede a:</p>
          <a href="${process.env.NEXTAUTH_URL || 'https://tudominio.com'}/dashboard/certificados" class="button">
            Ir al Panel de Certificados
          </a>
        </div>

        <div class="footer">
          <p>Este es un mensaje automático del sistema SAGO FACTU</p>
          <p>No responda a este correo</p>
        </div>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    to: email,
    subject,
    html: htmlContent,
  })
}

/**
 * Registra una tarea cron para verificar certificados diariamente
 * Llamar desde el archivo de inicialización de la aplicación
 */
export function initializeCertificateAlerts(): void {
  try {
    // Solo ejecutar en servidor
    if (typeof window !== 'undefined') {
      return
    }

    // Importar dinámicamente node-cron
    import('node-cron').then((cron) => {
      // Ejecutar diariamente a las 8:00 AM
      const task = cron.schedule('0 8 * * *', async () => {
        hkaLogger.info('[CertificateAlerts] Ejecutando verificación cron')
        await sendCertificateExpirationAlerts()
      })

      hkaLogger.info('[CertificateAlerts] Tarea cron inicializada')

      // Ejecutar una vez al iniciar la aplicación
      sendCertificateExpirationAlerts().catch((error) => {
        hkaLogger.error('[CertificateAlerts] Error en verificación inicial:', {
          error: error instanceof Error ? error.message : String(error),
        })
      })
    })
  } catch (error) {
    hkaLogger.warn('[CertificateAlerts] No se pudo inicializar cron (puede ser normal en desarrollo)', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
