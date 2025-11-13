/**
 * Ejemplo de integración de extremo a extremo:
 * 1. Lectura de datos (simulados) desde un Excel.
 * 2. Normalización de cantidades, precios y cliente.
 * 3. Construcción del payload esperado por HKA.
 * 4. Transformación a XML y envío (mock).
 *
 * Este ejemplo sirve como referencia para scripts por lotes o pruebas locales.
 */

import { normalizeCustomerData, normalizeInvoiceItem } from '@/lib/hka/data-normalizer';
import { transformInvoiceToXMLInput } from '@/lib/hka/transformers/invoice-to-xml';
import { generarFacturaXML } from '@/lib/hka/xml/generator';

async function main() {
  // 1. Datos de origen (simulan lo que vendría de una hoja Excel)
  const rawInvoiceItems = [
    {
      DESCRIPCION: 'Servicio de soporte técnico',
      CODIGO: 'SRV-001',
      UNIDADMEDIDA: '',
      CANTIDAD: 1,
      PRECIO_UNITARIO: 26.724547,
      PRECIO_UNITARIO_DESCUENTO: 0,
      PRECIO_ITEM: 26.52,
      PRECIOACARREO: null,
      PRECIOSEGURO: undefined,
      TASA_ITBMS: 7,
    },
  ];

  const rawCustomer = {
    TIPO_CLIENTE_FE: '2',
    TIPO_CONTRIBUYENTE: null,
    NUMERO_RUC: '155738031',
    DV: null,
    RAZON_SOCIAL: 'FINANCIERA PIGSA S.A',
    Direccion: '934X+W75, Central y, C. 10, Colón',
    TELEFONO: null,
    CODIGO_UBICACION: '1-1-1',
    PROVINCIA: '1',
    DISTRITO: null,
    CORREGIMIENTO: null,
    PAIS: null,
    CORREO_ELECTRONICO: 'facturas@finanpigsa.com',
  };

  // 2. Normalización
  const normalizedItems = rawInvoiceItems.map(normalizeInvoiceItem);
  const normalizedCustomer = normalizeCustomerData(rawCustomer);

  // 3. Construcción del invoice (simplificado) con tipos de Prisma
  const invoice = {
    id: 'example-invoice',
    organizationId: 'org-1',
    createdBy: 'user-1',
    clientReferenceId: 'ref-1',
    issuerRuc: '155738031',
    issuerDv: '0',
    issuerName: 'FINANCIERA PIGSA S.A',
    issuerAddress: '934X+W75, Central y, C. 10, Colón',
    issuerEmail: 'factura@finanpigsa.com',
    receiverType: 'FINAL_CONSUMER',
    receiverRuc: normalizedCustomer.numeroRuc,
    receiverDv: normalizedCustomer.dv,
    receiverName: normalizedCustomer.razonSocial,
    receiverEmail: normalizedCustomer.correoElectronico,
    receiverAddress: normalizedCustomer.direccion,
    receiverPhone: normalizedCustomer.telefono,
    documentType: 'FACTURA',
    invoiceNumber: null,
    cufe: null,
    cafe: null,
    numeroDocumentoFiscal: null,
    qrCode: null,
    qrUrl: null,
    pointOfSale: '001',
    deliveryDate: null,
    paymentMethod: 'CASH',
    paymentTerm: 'CASH',
    xmlContent: null,
    subtotal: 26.52,
    discount: 0,
    subtotalAfterDiscount: 26.52,
    itbms: 1.86,
    total: 28.38,
    currency: 'PAB',
    issueDate: new Date(),
    dueDate: null,
    notes: null,
    internalNotes: null,
    status: 'DRAFT',
    hkaStatus: null,
    hkaMessage: null,
    rejectionReason: null,
    hkaCode: null,
    hkaProtocol: null,
    hkaProtocolDate: null,
    pdfBase64: null,
    hkaResponseCode: null,
    hkaResponseMessage: null,
    hkaResponseData: null,
    hkaLastAttempt: null,
    hkaAttempts: 0,
    pdfDescargado: false,
    xmlDescargado: false,
    xmlUrl: null,
    pdfUrl: null,
    rawXml: null,
    isCancelled: false,
    cancelledAt: null,
    cancellationReason: null,
    cancellationCufe: null,
    retryCount: 0,
    maxRetries: 3,
    nextRetryAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    queuedAt: null,
    sentAt: null,
    certifiedAt: null,
    items: normalizedItems.map((item, index) => ({
      id: `item-${index}`,
      invoiceId: 'example-invoice',
      lineNumber: index + 1,
      code: item.codigo ?? '',
      description: item.descripcion,
      quantity: Number.parseFloat(item.cantidad),
      unitPrice: Number.parseFloat(item.precioUnitario),
      unit: item.unidadMedida ?? 'UND',
      discount: 0,
      discountRate: 0,
      discountedPrice: Number.parseFloat(item.precioUnitarioDescuento),
      taxRate: Number.parseFloat(item.tasaItbms),
      taxCode: '01',
      taxAmount: Number.parseFloat(item.precioItem) - Number.parseFloat(item.precioUnitario),
      subtotal: Number.parseFloat(item.precioItem),
      total: Number.parseFloat(item.precioItem),
      cpbsCode: null,
      cpbsUnit: null,
      metadata: null,
    })),
    organization: {
      id: 'org-1',
      slug: 'org-1',
      name: 'FINANCIERA PIGSA S.A',
      ruc: '155738031',
      dv: '0',
      email: 'factura@finanpigsa.com',
      phone: null,
      address: '934X+W75, Central y, C. 10, Colón',
      hkaEnabled: true,
      hkaTokenUser: null,
      maxUsers: 10,
      maxFolios: null,
      isActive: true,
      suspendedAt: null,
      suspendReason: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      logo: null,
      website: null,
      autoSendToHKA: true,
      branchCode: '0000',
      corregimiento: 'SAN FELIPE',
      district: 'PANAMA',
      emailOnCertification: true,
      emailOnError: true,
      locationCode: '1-1-1',
      lowFoliosThreshold: 10,
      province: 'PANAMA',
      requireApproval: false,
      rucType: '2',
      tradeName: 'FINANCIERA PIGSA S.A',
      hkaEnvironment: 'demo',
      hkaTokenPassword: null,
      plan: 'ENTERPRISE',
    },
    customer: null,
  } as any;

  // 4. Transformación a XML esperado por HKA
  const xmlInput = transformInvoiceToXMLInput(invoice, normalizedCustomer as any);
  const xml = generarFacturaXML(xmlInput);

  console.log('XML listo para enviar a HKA:');
  console.log(xml);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error en ejemplo de integración HKA:', error);
    process.exitCode = 1;
  });
}


