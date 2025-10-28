// ============================================
// WORKER: PROCESAMIENTO DE FACTURAS
// ============================================
// Worker BullMQ que procesa facturas en background:
// 1. Transform Invoice → XML Input
// 2. Genera XML
// 3. Valida XML
// 4. Envía a HKA
// 5. Actualiza status del Invoice
// 6. Envía email (opcional)

import { Job } from 'bullmq';
import { prisma } from '@/lib/db';
import { generateXMLFromInvoice } from '@/lib/hka/transformers/invoice-to-xml';
import { enviarDocumento } from '@/lib/hka/methods/enviar-documento';

// ============================================
// TIPOS
// ============================================

export interface ProcessInvoiceJobData {
  invoiceId: string;
  sendToHKA?: boolean; // Default: true
  sendEmail?: boolean; // Default: true
}

export interface ProcessInvoiceResult {
  success: boolean;
  invoiceId: string;
  cufe?: string;
  hkaProtocol?: string;
  hkaStatus?: string;
  xmlGenerated: boolean;
  sentToHKA: boolean;
  emailSent: boolean;
  error?: string;
}

// ============================================
// WORKER PRINCIPAL
// ============================================

export async function processInvoice(
  job: Job<ProcessInvoiceJobData>
): Promise<ProcessInvoiceResult> {
  const { invoiceId, sendToHKA = true, sendEmail = true } = job.data;

  console.log('');
  console.log('='.repeat(60));
  console.log(`🔄 Procesando Invoice: ${invoiceId}`);
  console.log('='.repeat(60));

  const result: ProcessInvoiceResult = {
    success: false,
    invoiceId,
    xmlGenerated: false,
    sentToHKA: false,
    emailSent: false,
  };

  try {
    // ============================================
    // PASO 1: Obtener Invoice con relaciones
    // ============================================
    console.log('\n📋 PASO 1: Obtener Invoice de BD...');

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        organization: true,
        items: true,
        user: true,
        customer: true, // Incluir relación customer
      },
    });

    if (!invoice) {
      throw new Error(`Invoice no encontrado: ${invoiceId}`);
    }

    console.log(`   ✅ Invoice encontrado: ${invoice.invoiceNumber}`);
    console.log(`   Organization: ${invoice.organization.name}`);
    console.log(`   Items: ${invoice.items.length}`);
    console.log(`   Total: $${Number(invoice.total).toFixed(2)}`);
    console.log(`   Status actual: ${invoice.status}`);

    // Verificar que no esté ya procesado
    if (invoice.status === 'CERTIFIED') {
      console.log(`   ⚠️  Invoice ya está certificado, saltando procesamiento`);
      result.success = true;
      result.cufe = invoice.cufe || undefined;
      return result;
    }

    // ============================================
    // PASO 2: Obtener Customer
    // ============================================
    console.log('\n👤 PASO 2: Obtener Customer...');

    // Validar que existe clientReferenceId
    if (!invoice.clientReferenceId) {
      throw new Error('Invoice no tiene cliente asociado (clientReferenceId es null)');
    }

    const customer = await prisma.customer.findUnique({
      where: { id: invoice.clientReferenceId },
    });

    if (!customer) {
      throw new Error(`Customer no encontrado: ${invoice.clientReferenceId}`);
    }

    console.log(`   ✅ Customer: ${customer.name}`);
    console.log(`   RUC: ${customer.ruc}-${customer.dv}`);

    // ============================================
    // PASO 3: Generar XML
    // ============================================
    console.log('\n🔨 PASO 3: Generar XML...');

    // Pasar customer a través de invoice.customer para que transformInvoiceToXMLInput lo encuentre
    const invoiceWithCustomer = {
      ...invoice,
      customer: customer,
    };

    let resultGenerate: { xml: string; cufe: string; errores: string[] };
    
    try {
      resultGenerate = await generateXMLFromInvoice(
        invoiceWithCustomer as any,
        customer
      );
    } catch (error) {
      // Si generateXMLFromInvoice lanza error, crear respuesta con errores
      console.error('Error en generateXMLFromInvoice:', error);
      resultGenerate = {
        xml: '',
        cufe: '',
        errores: [error instanceof Error ? error.message : 'Error generando XML']
      };
    }

    // Validar que la respuesta es válida
    if (!resultGenerate || !resultGenerate.errores || !Array.isArray(resultGenerate.errores)) {
      throw new Error('Error generando XML: respuesta inválida del generador');
    }

    const { xml, cufe, errores } = resultGenerate;

    if (errores.length > 0) {
      const errorMsg = `Errores de validación: ${errores.join(', ')}`;
      console.error(`   ❌ ${errorMsg}`);

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'ERROR',
          xmlContent: null,
        },
      });

      throw new Error(errorMsg);
    }

    console.log(`   ✅ XML generado exitosamente`);
    console.log(`   CUFE: ${cufe}`);
    console.log(`   Longitud: ${xml.length} caracteres`);

    result.xmlGenerated = true;
    result.cufe = cufe;

    // ============================================
    // PASO 4: Guardar XML en BD
    // ============================================
    console.log('\n💾 PASO 4: Guardar XML en BD...');

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        xmlContent: xml,
        cufe: cufe,
        status: 'PROCESSING',
      },
    });

    console.log(`   ✅ XML guardado en BD`);

    // ============================================
    // PASO 5: Enviar a HKA (si está habilitado)
    // ============================================
    if (sendToHKA) {
      console.log('\n📤 PASO 5: Enviar a HKA...');

      try {
        const hkaResponse = await enviarDocumento(xml, invoiceId);

        console.log(`   ✅ Respuesta de HKA recibida`);
        console.log(`   Código: ${hkaResponse.dCodRes}`);
        console.log(`   Mensaje: ${hkaResponse.dMsgRes}`);
        console.log(`   Protocolo: ${hkaResponse.dProtocolo}`);

        result.sentToHKA = true;
        result.hkaProtocol = hkaResponse.dProtocolo;
        result.hkaStatus = hkaResponse.dCodRes;

        // Verificar si fue exitoso
        if (hkaResponse.dCodRes === '0200') {
          console.log(`   🎉 ¡Factura CERTIFICADA por HKA!`);
          result.success = true;
        } else {
          console.log(`   ⚠️  HKA rechazó la factura`);
          result.success = false;
          result.error = hkaResponse.dMsgRes;
        }
      } catch (hkaError) {
        console.error(`   ❌ Error al enviar a HKA:`, hkaError);
        result.sentToHKA = false;
        result.error =
          hkaError instanceof Error ? hkaError.message : 'Error desconocido';
        throw hkaError;
      }
    } else {
      console.log('\n⏭️  PASO 5: Envío a HKA deshabilitado (modo test)');
      
      // En modo test, marcar como certificado (simulado)
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PROCESSING', // Dejar en PROCESSING si no se envía a HKA
        },
      });
      
      result.success = true;
    }

    // ============================================
    // PASO 6: Enviar Email (si está habilitado)
    // ============================================
    if (sendEmail && result.success) {
      console.log('\n📧 PASO 6: Enviar email...');

      try {
        // TODO: Implementar envío de email
        // await sendInvoiceEmail(invoice, customer, xml, cufe);
        console.log(`   ⏭️  Email no implementado aún`);
        result.emailSent = false;
      } catch (emailError) {
        console.error(`   ⚠️  Error al enviar email:`, emailError);
        result.emailSent = false;
        // No lanzar error, el email es opcional
      }
    } else {
      console.log('\n⏭️  PASO 6: Email deshabilitado o procesamiento falló');
    }

    // ============================================
    // RESULTADO FINAL
    // ============================================
    console.log('\n' + '='.repeat(60));
    if (result.success) {
      console.log(`✅ PROCESAMIENTO EXITOSO`);
    } else {
      console.log(`⚠️  PROCESAMIENTO COMPLETADO CON ADVERTENCIAS`);
    }
    console.log('='.repeat(60));
    console.log(`Invoice: ${invoice.invoiceNumber}`);
    console.log(`CUFE: ${result.cufe || 'N/A'}`);
    console.log(`Status: ${result.success ? 'CERTIFIED/APPROVED' : 'PROCESSING/FAILED'}`);
    console.log(`XML Generado: ${result.xmlGenerated ? 'SÍ' : 'NO'}`);
    console.log(`Enviado a HKA: ${result.sentToHKA ? 'SÍ' : 'NO'}`);
    console.log(`Email Enviado: ${result.emailSent ? 'SÍ' : 'NO'}`);
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
    console.log('='.repeat(60));
    console.log('');

    return result;
  } catch (error) {
    console.error('\n❌ ERROR EN PROCESAMIENTO:');
    console.error(error);
    console.error('');

    result.success = false;
    result.error = error instanceof Error ? error.message : 'Error desconocido';

    // Actualizar estado a ERROR
    try {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'ERROR',
        },
      });
    } catch (updateError) {
      console.error('Error al actualizar estado a ERROR:', updateError);
    }

    throw error;
  }
}

// ============================================
// FUNCIÓN HELPER: Procesar Invoice Directamente
// ============================================

/**
 * Procesa un invoice directamente sin usar BullMQ
 * Útil para testing y procesamiento síncrono
 */
export async function processInvoiceDirectly(
  invoiceId: string,
  options: {
    sendToHKA?: boolean;
    sendEmail?: boolean;
  } = {}
): Promise<ProcessInvoiceResult> {
  const jobData: ProcessInvoiceJobData = {
    invoiceId,
    sendToHKA: options.sendToHKA ?? true,
    sendEmail: options.sendEmail ?? false,
  };

  // Simular un Job de BullMQ
  const mockJob = {
    data: jobData,
    id: `manual-${Date.now()}`,
  } as Job<ProcessInvoiceJobData>;

  return processInvoice(mockJob);
}

