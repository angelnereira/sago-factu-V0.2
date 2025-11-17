import { getHKAClient } from '../soap/client';
import { EnviarDocumentoParams, EnviarDocumentoResponse, HKACredentials } from '../soap/types';
import { prisma } from '@/lib/db';
import { monitorHKACall } from '@/lib/monitoring/hka-monitor-wrapper';
import { hkaTestModeWrapper } from '../utils/test-mode';
import { validarRUCCompleto, generarRUCPrueba } from '../utils/ruc-validator';
import { getPanamaTimestamp } from '@/lib/utils/date-timezone';
import { decryptToken } from '@/lib/utils/encryption';
import { validateXMLStructure, generateValidationReport } from '../validators/xml-validator';
import { hkaLogger } from '../utils/logger';
import { parseHKAResponse, validateMinimumResponse, toEnviarDocumentoResponse } from '../utils/response-parser';
import { withRetryOrThrow } from '../utils/retry';
import { signInvoiceXml } from '@/services/invoice/signer';
import { executeWithCredentials, resolveHKACredentials } from '../credentials-manager';

/**
 * Obtiene credenciales HKA usando el sistema mejorado de resolución
 *
 * ARQUITECTURA:
 * 1. Intenta obtener credenciales específicas de la organización/usuario
 * 2. Si no hay credenciales específicas, usa IHkaSecretProvider (env/vault)
 * 3. Nunca mezcla credenciales de diferentes fuentes
 *
 * ✅ SEGURO: Usa resolveHKACredentials() que valida y resuelve automáticamente
 */
async function getHKACredentialsForInvoice(
  organizationId: string | null,
  userId?: string
): Promise<HKACredentials> {
  if (!organizationId) {
    throw new Error(
      'organizationId es requerido para resolver credenciales HKA. ' +
      'Verifica que la factura esté asociada a una organización válida.'
    );
  }

  try {
    // Usar el nuevo sistema de resolución de credenciales
    // que integra IHkaSecretProvider para Plan Empresarial
    const credentials = await resolveHKACredentials(organizationId, { userId });

    console.log(`   🔑 Credenciales HKA resueltas`, {
      source: credentials.source,
      environment: credentials.environment,
    });

    return credentials;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`   ❌ Error resolviendo credenciales HKA:`, errorMsg);
    throw new Error(
      'Credenciales HKA no disponibles. ' +
      `Detalle: ${errorMsg}. ` +
      'Configura tus credenciales en Configuración → Integraciones (Plan Simple) ' +
      'o define variables de entorno (Plan Empresarial).'
    );
  }
}

/**
 * Envía un documento electrónico a HKA (Factura, Nota Crédito, Nota Débito)
 *
 * ✅ ARQUITECTURA: Usa IHkaSecretProvider para obtener credenciales de forma segura
 * - Plan Simple: credenciales de HKACredential table
 * - Plan Empresarial: credenciales del secretProvider (env/vault)
 */
export async function enviarDocumento(
  xmlDocumento: string,
  invoiceId: string,
  organizationId?: string,
  userId?: string
): Promise<EnviarDocumentoResponse> {
  try {
    await hkaLogger.info('ENVIAR_DOCUMENTO_START', `Enviando documento a HKA para invoice: ${invoiceId}`, {
      invoiceId,
      organizationId,
      userId,
    });

    if (!organizationId) {
      throw new Error(
        'organizationId es requerido para enviar documento a HKA. ' +
        'Verifica que la factura esté asociada a una organización válida.'
      );
    }

    // Obtener información básica de la organización (NO credenciales)
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        plan: true,
        hkaEnvironment: true,
      },
    });

    if (!organization) {
      throw new Error(`Organización no encontrada: ${organizationId}`);
    }

    console.log(`   📋 Organización: ${organization.id}, Plan: ${organization.plan}`);
    console.log(`   🔑 Resolviendo credenciales de forma segura...`);

    // Validar RUC en el XML antes de enviar
    const rucValidation = await validarRUCEnXML(xmlDocumento);
    if (!rucValidation.isValid) {
      console.warn(`⚠️ RUC inválido detectado: ${rucValidation.errors.join(', ')}`);
      
      // Si está en modo de prueba, usar RUC de prueba
      if (hkaTestModeWrapper.isTestMode()) {
        console.log(`🧪 [TEST MODE] Usando RUC de prueba válido`);
        xmlDocumento = await corregirRUCEnXML(xmlDocumento);
      }
    }

    // Usar wrapper de modo de prueba
    const response = await hkaTestModeWrapper.enviarDocumento(
      xmlDocumento,
      invoiceId,
      async () => {
        // Método real de envío
        // Obtener credenciales usando el nuevo sistema IHkaSecretProvider
        const credentials = await getHKACredentialsForInvoice(organizationId, userId);

        // Validación defensiva de credenciales antes de invocar HKA
        if (!credentials?.tokenEmpresa || !credentials?.tokenPassword) {
          throw new Error(
            'Credenciales HKA inválidas después de resolución. ' +
            'Verifica que las credenciales estén correctamente configuradas. ' +
            'Si es Plan Simple, configura en Configuración → Integraciones. ' +
            'Si es Plan Empresarial, configura variables de entorno HKA_*_TOKEN_*.'
          );
        }

        await hkaLogger.info('CREDENTIALS_VALIDATED', `Credenciales válidas: ${credentials.tokenEmpresa.substring(0, 10)}...`, {
          invoiceId,
          organizationId,
        });

        const environment = (organization?.hkaEnvironment || 'demo').toLowerCase();
        const isDemoEnvironment = environment === 'demo';

        try {
          xmlDocumento = await signInvoiceXml(xmlDocumento, organizationId);
        } catch (signatureError) {
          if (!isDemoEnvironment) {
            throw signatureError instanceof Error
              ? signatureError
              : new Error(String(signatureError));
          }

          await hkaLogger.warn('XML_SIGNATURE_PLACEHOLDER', 'No se pudo firmar con certificado, usando firma simulada en DEMO', {
            invoiceId,
            organizationId,
            error: signatureError instanceof Error ? signatureError : new Error(String(signatureError)),
          });
        }

        // HKA espera el XML como texto plano sin escapar
        // Remover la declaración XML del inicio si existe
        let xmlLimpio = xmlDocumento
          .replace(/^\uFEFF/, '') // Quitar BOM si existe
          .trim();

        // Eliminar TODAS las declaraciones XML que puedan quedar (inicio o en medio)
        if (xmlLimpio.includes('<?xml')) {
          xmlLimpio = xmlLimpio
            .replace(/<\?xml[^>]*\?>/gi, ' ')
            .trim();
        }

        // Homogeneizar saltos de línea/espacios antes de rFE
        xmlLimpio = xmlLimpio.replace(/\s*(<rFE[\s>])/i, '$1').trim();

        // Utilizar la versión normalizada como documento principal
        xmlDocumento = xmlLimpio;

        const hasSignatureTag = /<ds:Signature|<Signature/i.test(xmlLimpio);

        if (isDemoEnvironment && !hasSignatureTag && xmlLimpio.includes('</rFE>')) {
        const demoSignature = `
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
      <ds:Reference URI="">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
          <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
        <ds:DigestValue>DEMO_DIGEST_VALUE</ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>DEMO_SIGNATURE_VALUE</ds:SignatureValue>
    <ds:KeyInfo>
      <ds:X509Data>
        <ds:X509Certificate>DEMO_CERTIFICATE</ds:X509Certificate>
      </ds:X509Data>
    </ds:KeyInfo>
  </ds:Signature>`;

          xmlLimpio = xmlLimpio.replace('</rFE>', `${demoSignature}
</rFE>`);
          xmlDocumento = xmlDocumento.replace('</rFE>', `${demoSignature}
</rFE>`);

          await hkaLogger.warn('DEMO_SIGNATURE_PLACEHOLDER', 'Se agregó firma simulada para ambiente DEMO', {
            invoiceId,
            organizationId: organization?.id,
          });
        }

        // ============================================
        // VALIDACIÓN EXHAUSTIVA DEL XML ANTES DE ENVIAR
        // ============================================
        await hkaLogger.info('XML_VALIDATION_START', 'Validando estructura completa del XML antes de enviar a HKA', {
          invoiceId,
          organizationId: organization?.id,
        });
        
        xmlLimpio = xmlDocumento.replace(/\s+/g, ' ');

        // Usar módulo de validación estructurado
        const validationResult = validateXMLStructure(xmlLimpio);
        
        if (!validationResult.isValid) {
          const report = generateValidationReport(validationResult);
          await hkaLogger.error('XML_VALIDATION_FAILED', 'XML no válido para HKA', {
            invoiceId,
            organizationId: organization?.id,
            data: { errors: validationResult.errors, warnings: validationResult.warnings },
            error: new Error(validationResult.errors.join('; ')),
          });
          
          // Guardar XML para debugging
          await hkaLogger.saveXMLDebug(xmlDocumento, invoiceId, 'validation-failed');
          
          throw new Error(`XML inválido para HKA:\n${report}`);
        }
        
        // Log warnings si existen
        if (validationResult.warnings.length > 0) {
          await hkaLogger.warn('XML_VALIDATION_WARNINGS', 'Advertencias en validación XML', {
            invoiceId,
            organizationId: organization?.id,
            data: { warnings: validationResult.warnings },
          });
        }
        
        await hkaLogger.info('XML_VALIDATION_SUCCESS', 'XML válido para HKA', {
          invoiceId,
          organizationId: organization?.id,
        });
        
        // Validaciones adicionales puntuales
        const esConsumidorFinal = /<iTipoRec>\s*02\s*<\/iTipoRec>/.test(xmlLimpio);
        const tieneGucRec = /<gRucRec>/.test(xmlLimpio);

        // Validaciones de campos críticos según formato rFE v1.00 de HKA/DGI
        // IMPORTANTE: Usar los nombres EXACTOS que se generan en el XML según documentación HKA
        const validaciones: { campo: string; encontrado: boolean; regex: RegExp }[] = [
          // Emisor
          { campo: 'dRuc (Emisor)', encontrado: /<gRucEmi>[\s\S]*?<dRuc>[^<]+<\/dRuc>/.test(xmlLimpio), regex: /<gRucEmi>[\s\S]*?<dRuc>([^<]+)<\/dRuc>/ },
          { campo: 'dDV (Emisor)', encontrado: /<gRucEmi>[\s\S]*?<dDV>[^<]+<\/dDV>/.test(xmlLimpio), regex: /<gRucEmi>[\s\S]*?<dDV>([^<]+)<\/dDV>/ },
          { campo: 'dTipoRuc (Emisor)', encontrado: /<gRucEmi>[\s\S]*?<dTipoRuc>[^<]+<\/dTipoRuc>/.test(xmlLimpio), regex: /<gRucEmi>[\s\S]*?<dTipoRuc>([^<]+)<\/dTipoRuc>/ },
          { campo: 'dNombEm (Razón Social Emisor)', encontrado: /<dNombEm>[^<]+<\/dNombEm>/.test(xmlLimpio), regex: /<dNombEm>([^<]+)<\/dNombEm>/ },
          { campo: 'dDirecEm (Dirección Emisor)', encontrado: /<dDirecEm>[^<]+<\/dDirecEm>/.test(xmlLimpio), regex: /<dDirecEm>([^<]+)<\/dDirecEm>/ },
          { campo: 'dNombRec (Nombre Receptor)', encontrado: /<dNombRec>[^<]+<\/dNombRec>/.test(xmlLimpio), regex: /<dNombRec>([^<]+)<\/dNombRec>/ },
          { campo: 'dDirecRec (Dirección Receptor)', encontrado: /<dDirecRec>[^<]+<\/dDirecRec>/.test(xmlLimpio), regex: /<dDirecRec>([^<]+)<\/dDirecRec>/ },
          // Items y Totales - Verificar que gItem tenga contenido válido
          // gItem debe tener al menos dDescProd (descripción) y dCantCodInt (cantidad)
          { campo: 'gItem (Items con descripción)', encontrado: /<gItem>[\s\S]*?<dDescProd>[^<]+<\/dDescProd>/.test(xmlLimpio), regex: /<gItem>[\s\S]*?<dDescProd>([^<]+)<\/dDescProd>/ },
          { campo: 'gItem (Items con cantidad)', encontrado: /<gItem>[\s\S]*?<dCantCodInt>[^<]+<\/dCantCodInt>/.test(xmlLimpio), regex: /<gItem>[\s\S]*?<dCantCodInt>([^<]+)<\/dCantCodInt>/ },
          { campo: 'dTotNeto (Total Neto)', encontrado: /<dTotNeto>[^<]+<\/dTotNeto>/.test(xmlLimpio), regex: /<dTotNeto>([^<]+)<\/dTotNeto>/ },
          { campo: 'dVTot (Total Final)', encontrado: /<dVTot>[^<]+<\/dVTot>/.test(xmlLimpio), regex: /<dVTot>([^<]+)<\/dVTot>/ },
          { campo: 'dId (CUFE)', encontrado: /<dId>[^<]+<\/dId>/.test(xmlLimpio), regex: /<dId>([^<]+)<\/dId>/ },
        ];

        if (!esConsumidorFinal || tieneGucRec) {
          validaciones.splice(
            5,
            0,
            { campo: 'dRuc (Receptor)', encontrado: /<gRucRec>[\s\S]*?<dRuc>[^<]+<\/dRuc>/.test(xmlLimpio), regex: /<gRucRec>[\s\S]*?<dRuc>([^<]+)<\/dRuc>/ },
            { campo: 'dDV (Receptor)', encontrado: /<gRucRec>[\s\S]*?<dDV>[^<]+<\/dDV>/.test(xmlLimpio), regex: /<gRucRec>[\s\S]*?<dDV>([^<]+)<\/dDV>/ },
          );
        } else {
          console.log('   ✅ Receptor marcado como consumidor final: se omite validación de dRuc/dDV.');
        }

        // Log de validaciones
        const faltantes: string[] = [];
        validaciones.forEach(v => {
          if (!v.encontrado) {
            faltantes.push(v.campo);
            console.error(`   ❌ Falta: ${v.campo}`);
          } else {
            const match = xmlLimpio.match(v.regex);
            const valor = match ? match[0].substring(0, 50) : 'N/A';
            console.log(`   ✅ ${v.campo}: ${valor}`);
          }
        });

        // Si faltan campos críticos, lanzar error con detalles
        if (faltantes.length > 0) {
          const errorDetallado = `XML incompleto para HKA. Faltan campos críticos:\n${faltantes.map(f => `  - ${f}`).join('\n')}\n\nRevise los datos del emisor, receptor e ítems de la factura.`;
          console.error('❌ Validación XML falló:', errorDetallado);
          throw new Error(errorDetallado);
        }

        // Validar que los valores no estén vacíos
        const valoresVacios: string[] = [];
        validaciones.forEach(v => {
          if (v.encontrado) {
            const match = xmlLimpio.match(v.regex);
            if (match) {
              // Extraer el valor capturado (grupo 1 del regex) o del match completo
              let valor: string;
              if (match[1]) {
                // Si el regex tiene grupo de captura, usar ese valor
                valor = match[1].trim();
              } else {
                // Si no, extraer el valor entre las etiquetas
                valor = match[0].replace(/<\/?[^>]+(>|$)/g, '').trim();
              }
              
              if (!valor || valor === '' || valor === 'null' || valor === 'undefined') {
                valoresVacios.push(v.campo);
                console.error(`   ⚠️  ${v.campo} está vacío o es null`);
              }
            } else {
              // Si no se encontró el match pero el campo estaba marcado como encontrado,
              // puede ser que el regex no capturó correctamente
              console.warn(`   ⚠️  ${v.campo}: regex no capturó valor aunque campo fue marcado como encontrado`);
            }
          } else {
            // Para campos de items, verificar si hay al menos un gItem presente
            if (v.campo.includes('gItem')) {
              const hasAnyItem = /<gItem>/.test(xmlLimpio);
              if (!hasAnyItem) {
                console.error(`   ❌ No se encontraron ítems (gItem) en el XML`);
                valoresVacios.push(v.campo);
              } else {
                // Verificar que el gItem tenga contenido
                const itemContent = xmlLimpio.match(/<gItem>([\s\S]*?)<\/gItem>/);
                if (!itemContent || itemContent[1].trim().length < 10) {
                  console.error(`   ❌ Ítem encontrado pero sin contenido válido`);
                  valoresVacios.push(v.campo);
                }
              }
            }
          }
        });

        if (valoresVacios.length > 0) {
          const errorDetallado = `XML inválido para HKA. Campos con valores vacíos o null:\n${valoresVacios.map(f => `  - ${f}`).join('\n')}\n\nRevise que todos los campos tengan valores válidos.`;
          console.error('❌ Validación XML falló:', errorDetallado);
          throw new Error(errorDetallado);
        }

        // Guardar XML completo para debugging (SIEMPRE)
        const xmlDebugPath = await hkaLogger.saveXMLDebug(xmlDocumento, invoiceId, 'pre-envio');
        await hkaLogger.debug('XML_PRE_ENVIO', `XML guardado para debugging: ${xmlDebugPath}`, {
          invoiceId,
          organizationId: organization?.id,
          data: { xmlLength: xmlLimpio.length, debugPath: xmlDebugPath },
        });

        // Obtener cliente SOAP HKA
        const hkaClient = getHKAClient();
        await hkaClient.initialize();

        // Parámetros para envío
        const params: EnviarDocumentoParams = {
          tokenEmpresa: credentials.tokenEmpresa,
          tokenPassword: credentials.tokenPassword,
          documento: xmlLimpio, // Enviar sin declaración XML
        };

        // Invocar método SOAP "Enviar" con monitoreo y reintentos
        await hkaLogger.info('HKA_SOAP_INVOKE_START', 'Invocando método SOAP Enviar de HKA', {
          invoiceId,
          organizationId: organization?.id,
        });
        
        const rawResponse = await withRetryOrThrow(
          async () => {
            return await monitorHKACall('Enviar', async () => {
              return await hkaClient.invokeWithCredentials<any>('Enviar', params, credentials);
            });
          },
          {
            maxRetries: 3,
            initialDelayMs: 2000,
            maxDelayMs: 10000,
          }
        );
        
        // Parsear respuesta robusta
        await hkaLogger.debug('HKA_RESPONSE_RECEIVED', 'Respuesta recibida de HKA, parseando...', {
          invoiceId,
          organizationId: organization?.id,
          data: { responseType: typeof rawResponse, hasResponse: !!rawResponse },
        });
        
        const parsedResponse = parseHKAResponse(rawResponse);
        
        // Validar respuesta mínima
        const responseValidation = validateMinimumResponse(parsedResponse);
        if (!responseValidation.isValid) {
          await hkaLogger.error('HKA_RESPONSE_INVALID', 'Respuesta HKA no contiene campos mínimos requeridos', {
            invoiceId,
            organizationId: organization?.id,
            data: { missingFields: responseValidation.missingFields },
            error: new Error(`Campos faltantes: ${responseValidation.missingFields.join(', ')}`),
          });
          throw new Error(`Respuesta HKA incompleta. Campos faltantes: ${responseValidation.missingFields.join(', ')}`);
        }
        
        // Convertir a formato EnviarDocumentoResponse
        const response = toEnviarDocumentoResponse(parsedResponse);
        
        await hkaLogger.info('HKA_SOAP_INVOKE_SUCCESS', 'Respuesta HKA parseada exitosamente', {
          invoiceId,
          organizationId: organization?.id,
          data: {
            codigo: response.dCodRes,
            mensaje: response.dMsgRes,
            hasCufe: !!response.dCufe,
            hasCafe: !!response.CAFE,
            hasPdf: !!response.PDF,
          },
        });
        
        return response;
      }
    );

    await hkaLogger.info('ENVIAR_DOCUMENTO_SUCCESS', 'Documento enviado exitosamente a HKA', {
      invoiceId,
      organizationId,
      data: {
        cufe: response.dCufe,
        cafe: response.CAFE,
        protocolo: response.nroProtocoloAutorizacion || response.dProtocolo,
        codigo: response.dCodRes,
        mensaje: response.dMsgRes,
      },
    });

    // Verificar si la respuesta indica éxito
    const isSuccess = response.Exito !== false && (response.dCodRes === '200' || response.dCodRes === '0200');
    
    // Determinar mensaje de error si existe
    let errorMessage = response.dMsgRes || response.Mensaje;
    if (response.Errores && response.Errores.length > 0) {
      errorMessage = response.Errores.map((err) => `${err.Codigo}: ${err.Descripcion}`).join('; ');
    }

    // Determinar si el QR es una URL o Base64
    // Según la documentación oficial, HKA devuelve el QR como URL para consulta DGI
    const qrUrl = response.qr || (response.dQr && response.dQr.startsWith('http') ? response.dQr : null);
    const qrCodeBase64 = response.CodigoQR || (response.dQr && !response.dQr.startsWith('http') ? response.dQr : null);
    
    // Actualizar en base de datos con Prisma - CAPTURA COMPLETA DE RESPUESTA
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        // Códigos de identificación
        cufe: response.dCufe,
        cafe: response.CAFE,
        numeroDocumentoFiscal: response.NumeroDocumentoFiscal,
        hkaProtocol: response.nroProtocoloAutorizacion || response.dProtocolo,
        
        // Archivos en Base64
        pdfBase64: response.PDF || response.xContPDF,
        qrCode: qrCodeBase64, // QR como imagen Base64 (si está disponible)
        qrUrl: qrUrl, // URL del QR para consulta en DGI (según documentación oficial)
        rawXml: response.XMLFirmado, // XML firmado por DGI
        
        // Metadatos HKA
        hkaResponseCode: response.dCodRes,
        hkaResponseMessage: errorMessage || response.Mensaje || response.dMsgRes,
        hkaProtocolDate: (response.fechaRecepcionDGI || response.FechaRecepcion)
          ? new Date(response.fechaRecepcionDGI || response.FechaRecepcion || '') 
          : null,
        
        // Estado
        status: isSuccess ? 'CERTIFIED' : 'REJECTED',
        certifiedAt: isSuccess ? getPanamaTimestamp() : null,
      },
    });

    await hkaLogger.info('HKA_RESPONSE_SAVED', 'Respuesta de HKA guardada en BD', {
      invoiceId,
      organizationId,
      data: {
        hasPdf: !!(response.PDF || response.xContPDF),
        hasXml: !!response.XMLFirmado,
        hasQr: !!(qrCodeBase64 || qrUrl),
        status: isSuccess ? 'CERTIFIED' : 'REJECTED',
      },
    });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar a HKA';
    
    await hkaLogger.error('ENVIAR_DOCUMENTO_ERROR', `Error al enviar documento a HKA: ${errorMessage}`, {
      invoiceId,
      organizationId,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    
    // Actualizar error en base de datos
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'ERROR',
        hkaResponseCode: 'ERROR',
        hkaResponseMessage: errorMessage,
      },
    }).catch(dbError => {
      hkaLogger.error('DB_UPDATE_ERROR', 'Error actualizando estado de factura en BD', {
        invoiceId,
        error: dbError instanceof Error ? dbError : new Error(String(dbError)),
      });
    });

    throw error;
  }
}

/**
 * Valida el RUC en el XML del documento
 */
async function validarRUCEnXML(xmlDocumento: string): Promise<{
  isValid: boolean;
  errors: string[];
  rucEncontrado?: string;
}> {
  try {
    // Extraer RUC del XML usando regex
    // Buscar dentro de gRucEmi para el emisor
    const rucEmisorMatch = xmlDocumento.match(/<gRucEmi>[\s\S]*?<dRuc>([^<]+)<\/dRuc>/);
    const dvEmisorMatch = xmlDocumento.match(/<gRucEmi>[\s\S]*?<dDV>([^<]+)<\/dDV>/);
    const tipoRucMatch = xmlDocumento.match(/<gRucEmi>[\s\S]*?<dTipoRuc>([^<]+)<\/dTipoRuc>/);
    
    if (!rucEmisorMatch || !dvEmisorMatch) {
      return {
        isValid: false,
        errors: ['No se pudo extraer RUC o DV del emisor del XML']
      };
    }
    
    const ruc = rucEmisorMatch[1].trim();
    const dv = dvEmisorMatch[1].trim();
    const tipoRuc = tipoRucMatch ? tipoRucMatch[1].trim() : '2'; // Default: Persona Jurídica
    
    // Validar que RUC y DV no estén vacíos
    if (!ruc || ruc === '' || ruc === 'null' || ruc === 'undefined') {
      return {
        isValid: false,
        errors: ['RUC del emisor está vacío o inválido']
      };
    }
    
    if (!dv || dv === '' || dv === 'null' || dv === 'undefined') {
      return {
        isValid: false,
        errors: ['DV del emisor está vacío o inválido']
      };
    }
    
    // Validar formato básico del RUC (debe ser numérico y tener al menos 8 dígitos)
    if (!/^\d{8,15}$/.test(ruc)) {
      return {
        isValid: false,
        errors: ['RUC del emisor debe contener solo números y tener entre 8-15 dígitos']
      };
    }
    
    // Validar formato del DV (debe ser numérico de 1-2 dígitos)
    if (!/^\d{1,2}$/.test(dv)) {
      return {
        isValid: false,
        errors: ['DV del emisor debe ser numérico de 1-2 dígitos']
      };
    }
    
    // RUCs válidos para demo (no validar formato completo en demo)
    const rucsValidosDemo = ['155738031', '123456789', '987654321'];
    const esDemo = rucsValidosDemo.includes(ruc);
    
    // Si es demo, solo validar formato básico (ya validado arriba)
    if (esDemo) {
      return {
        isValid: true,
        errors: [],
        rucEncontrado: `${ruc}-${dv}`
      };
    }
    
    // Para producción, intentar validar formato completo si es posible
    // Construir formato completo con año actual
    const añoActual = new Date().getFullYear();
    const rucCompleto = `${ruc}-${tipoRuc}-${añoActual}-${dv.padStart(2, '0')}`;
    
    // Intentar validar formato completo, pero no fallar si falla
    try {
      const validation = validarRUCCompleto(rucCompleto);
      if (!validation.isValid && validation.errors.length > 0) {
        // Solo mostrar advertencia, no error crítico
        await hkaLogger.warn('RUC_VALIDATION_WARNING', 'Validación completa de RUC falló, pero formato básico es válido', {
          data: { ruc, dv, errors: validation.errors },
        });
      }
    } catch (validationError) {
      // Ignorar errores de validación completa
    }
    
    // Si pasó las validaciones básicas, es válido
    return {
      isValid: true,
      errors: [],
      rucEncontrado: `${ruc}-${dv}`
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [`Error al validar RUC en XML: ${error instanceof Error ? error.message : 'Error desconocido'}`]
    };
  }
}

/**
 * Corrige el RUC en el XML usando un RUC de prueba válido
 */
async function corregirRUCEnXML(xmlDocumento: string): Promise<string> {
  try {
    const rucPrueba = generarRUCPrueba();
    const partes = rucPrueba.split('-');
    const [ruc, tipoRuc, año, dv] = partes;
    
    // Reemplazar RUC en el XML
    let xmlCorregido = xmlDocumento.replace(
      /<dRuc>[^<]+<\/dRuc>/,
      `<dRuc>${ruc}</dRuc>`
    );
    
    // Reemplazar DV en el XML
    xmlCorregido = xmlCorregido.replace(
      /<dDV>[^<]+<\/dDV>/,
      `<dDV>${dv}</dDV>`
    );
    
    // Reemplazar tipo de RUC si existe
    xmlCorregido = xmlCorregido.replace(
      /<dTipoRuc>[^<]+<\/dTipoRuc>/,
      `<dTipoRuc>${tipoRuc}</dTipoRuc>`
    );
    
    console.log(`🔧 RUC corregido en XML: ${rucPrueba}`);
    
    return xmlCorregido;
    
  } catch (error) {
    console.error('Error al corregir RUC en XML:', error);
    return xmlDocumento; // Retornar XML original si hay error
  }
}

