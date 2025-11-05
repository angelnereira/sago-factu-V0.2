import { getHKAClient } from '../soap/client';
import { EnviarDocumentoParams, EnviarDocumentoResponse, HKACredentials } from '../soap/types';
import { prisma } from '@/lib/db';
import { monitorHKACall } from '@/lib/monitoring/hka-monitor-wrapper';
import { hkaTestModeWrapper } from '../utils/test-mode';
import { validarRUCCompleto, generarRUCPrueba } from '../utils/ruc-validator';
import { getPanamaTimestamp } from '@/lib/utils/date-timezone';
import { decryptToken } from '@/lib/utils/encryption';

/**
 * Obtiene credenciales HKA priorizando BD sobre variables de entorno
 * Si hay organización con credenciales en BD, las usa; si no, usa variables de entorno
 */
async function getHKACredentialsForInvoice(
  organization: { hkaTokenUser: string | null; hkaTokenPassword: string | null; hkaEnvironment: string | null; plan: string } | null
): Promise<HKACredentials> {
  // Si hay organización con credenciales configuradas, usarlas
  if (organization?.hkaTokenUser && organization?.hkaTokenPassword) {
    console.log(`   🔑 Usando credenciales de BD (Plan: ${organization.plan})`);
    const environment = (organization.hkaEnvironment || 'demo').toLowerCase();
    
    try {
      const decryptedPassword = decryptToken(organization.hkaTokenPassword);
      return {
        tokenEmpresa: organization.hkaTokenUser,
        tokenPassword: decryptedPassword,
        usuario: organization.hkaTokenUser,
      };
    } catch (error) {
      console.error(`   ⚠️  Error desencriptando password de BD, usando variables de entorno:`, error);
      // Si hay error desencriptando, usar variables de entorno
      const hkaClient = getHKAClient();
      return hkaClient.getCredentials();
    }
  }

  // Si no, usar credenciales de variables de entorno (fallback)
  // Esto incluye las credenciales demo por defecto del .env
  console.log(`   🔑 Usando credenciales de variables de entorno (demo por defecto)`);
  const hkaClient = getHKAClient();
  const envCredentials = hkaClient.getCredentials();
  
  // Validar que las credenciales de entorno existan
  if (!envCredentials.tokenEmpresa || !envCredentials.tokenPassword) {
    throw new Error(
      'Credenciales HKA no configuradas. Configure credenciales en /simple/configuracion o en variables de entorno (.env):\n' +
      '  HKA_DEMO_TOKEN_USER=walgofugiitj_ws_tfhka\n' +
      '  HKA_DEMO_TOKEN_PASSWORD=Octopusp1oQs5'
    );
  }
  
  return envCredentials;
}

/**
 * Envía un documento electrónico a HKA (Factura, Nota Crédito, Nota Débito)
 */
export async function enviarDocumento(
  xmlDocumento: string,
  invoiceId: string,
  organizationId?: string
): Promise<EnviarDocumentoResponse> {
  try {
    console.log(`📤 Enviando documento a HKA para invoice: ${invoiceId}`);

    // Obtener organización para usar credenciales de BD si están disponibles
    let organization = null;
    if (organizationId) {
      organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          plan: true,
          hkaTokenUser: true,
          hkaTokenPassword: true,
          hkaEnvironment: true,
        },
      });
      
      if (organization) {
        console.log(`   📋 Organización: ${organization.id}, Plan: ${organization.plan}`);
        console.log(`   🔑 Credenciales HKA configuradas: ${!!organization.hkaTokenUser}`);
      }
    }

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
        // Obtener credenciales: primero de BD, luego de variables de entorno
        const credentials = await getHKACredentialsForInvoice(organization);

        // Validación defensiva de credenciales antes de invocar HKA
        if (!credentials?.tokenEmpresa || !credentials?.tokenPassword) {
          const errorMsg = organization?.hkaTokenUser 
            ? 'Credenciales HKA configuradas pero password inválido. Verifica la configuración.'
            : 'Credenciales HKA ausentes. Configure credenciales en /simple/configuracion o en variables de entorno (.env)';
          throw new Error(errorMsg);
        }

        console.log(`   ✅ Credenciales válidas: ${credentials.tokenEmpresa.substring(0, 10)}...`);

        // HKA espera el XML como texto plano sin escapar
        // Remover la declaración XML del inicio si existe
        let xmlLimpio = xmlDocumento.trim();
        if (xmlLimpio.startsWith('<?xml')) {
          // Encontrar el final de la declaración XML
          const endOfDeclaration = xmlLimpio.indexOf('?>');
          if (endOfDeclaration !== -1) {
            xmlLimpio = xmlLimpio.substring(endOfDeclaration + 2).trim();
          }
        }

        // ============================================
        // VALIDACIÓN EXHAUSTIVA DEL XML ANTES DE ENVIAR
        // ============================================
        console.log('🔍 Validando estructura completa del XML antes de enviar a HKA...');
        
        // Validaciones de campos críticos según formato rFE v1.00 de HKA/DGI
        // IMPORTANTE: Usar los nombres EXACTOS que se generan en el XML según documentación HKA
        const validaciones: { campo: string; encontrado: boolean; regex: RegExp }[] = [
          // Emisor
          { campo: 'dRuc (Emisor)', encontrado: /<gRucEmi>[\s\S]*?<dRuc>[^<]+<\/dRuc>/.test(xmlLimpio), regex: /<gRucEmi>[\s\S]*?<dRuc>([^<]+)<\/dRuc>/ },
          { campo: 'dDV (Emisor)', encontrado: /<gRucEmi>[\s\S]*?<dDV>[^<]+<\/dDV>/.test(xmlLimpio), regex: /<gRucEmi>[\s\S]*?<dDV>([^<]+)<\/dDV>/ },
          { campo: 'dTipoRuc (Emisor)', encontrado: /<gRucEmi>[\s\S]*?<dTipoRuc>[^<]+<\/dTipoRuc>/.test(xmlLimpio), regex: /<gRucEmi>[\s\S]*?<dTipoRuc>([^<]+)<\/dTipoRuc>/ },
          { campo: 'dNombEm (Razón Social Emisor)', encontrado: /<dNombEm>[^<]+<\/dNombEm>/.test(xmlLimpio), regex: /<dNombEm>([^<]+)<\/dNombEm>/ },
          { campo: 'dDirecEm (Dirección Emisor)', encontrado: /<dDirecEm>[^<]+<\/dDirecEm>/.test(xmlLimpio), regex: /<dDirecEm>([^<]+)<\/dDirecEm>/ },
          // Receptor - Los campos están dentro de gRucRec, no como dRucRe/dDVRe
          { campo: 'dRuc (Receptor)', encontrado: /<gRucRec>[\s\S]*?<dRuc>[^<]+<\/dRuc>/.test(xmlLimpio), regex: /<gRucRec>[\s\S]*?<dRuc>([^<]+)<\/dRuc>/ },
          { campo: 'dDV (Receptor)', encontrado: /<gRucRec>[\s\S]*?<dDV>[^<]+<\/dDV>/.test(xmlLimpio), regex: /<gRucRec>[\s\S]*?<dDV>([^<]+)<\/dDV>/ },
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

        console.log('✅ Validación XML completa: Todos los campos críticos están presentes y tienen valores válidos');
        
        // Guardar XML para debugging (solo si hay error después)
        if (process.env.NODE_ENV === 'development') {
          console.log(`📄 XML a enviar (primeros 500 chars): ${xmlLimpio.substring(0, 500)}...`);
        }

        // Obtener cliente SOAP HKA
        const hkaClient = getHKAClient();
        await hkaClient.initialize();

        // Parámetros para envío
        const params: EnviarDocumentoParams = {
          tokenEmpresa: credentials.tokenEmpresa,
          tokenPassword: credentials.tokenPassword,
          documento: xmlLimpio, // Enviar sin declaración XML
        };

        // Invocar método SOAP "Enviar" con monitoreo
        return await monitorHKACall('Enviar', async () => {
          return await hkaClient.invoke<EnviarDocumentoResponse>('Enviar', params);
        });
      }
    );

    console.log(`✅ Documento enviado exitosamente`);
    console.log(`   CUFE: ${response.dCufe}`);
    console.log(`   Protocolo: ${response.dProtocolo}`);
    console.log(`   Código: ${response.dCodRes}`);
    console.log(`   Mensaje: ${response.dMsgRes}`);

    // Verificar si la respuesta indica éxito
    const isSuccess = response.Exito !== false && response.dCodRes === '0200';
    
    // Determinar mensaje de error si existe
    let errorMessage = response.dMsgRes;
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
        hkaProtocol: response.dProtocolo || response.ProtocoloAutorizacion || response.nroProtocoloAutorizacion,
        
        // Archivos en Base64 (priorizar campos nuevos de la guía, luego legacy)
        pdfBase64: response.PDF || response.xContPDF,
        qrCode: qrCodeBase64, // QR como imagen Base64 (si está disponible)
        qrUrl: qrUrl, // URL del QR para consulta en DGI (según documentación oficial)
        rawXml: response.XMLFirmado, // XML firmado por DGI
        
        // Metadatos HKA
        hkaResponseCode: response.dCodRes,
        hkaResponseMessage: errorMessage || response.Mensaje || response.dMsgRes,
        hkaProtocolDate: response.FechaRecepcion || response.fechaRecepcionDGI 
          ? new Date(response.FechaRecepcion || response.fechaRecepcionDGI) 
          : null,
        
        // Estado
        status: isSuccess ? 'CERTIFIED' : 'REJECTED',
        certifiedAt: isSuccess ? getPanamaTimestamp() : null,
      },
    });

    console.log(`💾 Respuesta de HKA guardada en BD`);
    console.log(`   PDF: ${response.PDF || response.xContPDF ? 'Sí' : 'No'}`);
    console.log(`   XML Firmado: ${response.XMLFirmado ? 'Sí' : 'No'}`);
    console.log(`   QR: ${response.CodigoQR || response.dQr ? 'Sí' : 'No'}`);

    return response;
  } catch (error) {
    console.error('❌ Error al enviar documento:', error);
    
    // Determinar mensaje de error
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar a HKA';
    
    // Actualizar error en base de datos
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'REJECTED',
        hkaResponseCode: 'ERROR',
        hkaResponseMessage: errorMessage,
      },
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
    const rucMatch = xmlDocumento.match(/<dRuc>([^<]+)<\/dRuc>/);
    const dvMatch = xmlDocumento.match(/<dDV>([^<]+)<\/dDV>/);
    
    if (!rucMatch || !dvMatch) {
      return {
        isValid: false,
        errors: ['No se pudo extraer RUC o DV del XML']
      };
    }
    
    const ruc = rucMatch[1];
    const dv = dvMatch[1];
    const rucCompleto = `${ruc}-${dv}`;
    
    // Validar formato completo del RUC
    const validation = validarRUCCompleto(rucCompleto);
    
    return {
      isValid: validation.isValid,
      errors: validation.errors,
      rucEncontrado: rucCompleto
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

