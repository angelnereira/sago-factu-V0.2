// ============================================
// GENERADOR DE XML PARA HKA - DGI PANAMÁ
// ============================================
// Basado en formato rFE v1.00 de la DGI
// Compatible con The Factory HKA

import { create } from 'xmlbuilder2';
import { formatPanamaISO } from '@/lib/utils/date-timezone';

// ============================================
// TIPOS Y ENUMS
// ============================================

export enum TipoDocumento {
  FACTURA = '01',
  NOTA_CREDITO = '02',
  NOTA_DEBITO = '03',
  NOTA_ENTREGA = '04',
  EXPORTACION = '05',
}

export enum TipoAmbiente {
  PRODUCCION = 1,
  DEMO = 2,
}

export enum TipoEmision {
  NORMAL = '01',
  CONTINGENCIA = '02',
}

export enum TipoRUC {
  PERSONA_NATURAL = '1',
  PERSONA_JURIDICA = '2',
  EXTRANJERO = '3',
}

export enum TipoCliente {
  CONTRIBUYENTE = '01',
  CONSUMIDOR_FINAL = '02',
  GOBIERNO = '03',
  EXENTO = '04',
}

export enum FormaPago {
  EFECTIVO = '1',
  CHEQUE = '2',
  TRANSFERENCIA = '3',
  TARJETA_CREDITO = '4',
  TARJETA_DEBITO = '5',
  OTROS = '6',
}

export enum TasaITBMS {
  EXENTO = '00',
  TARIFA_0 = '01',
  TARIFA_10 = '02',
  TARIFA_15 = '03',
  TARIFA_7 = '04',
}

// ============================================
// INTERFACES
// ============================================

export interface EmisorData {
  tipoRuc: TipoRUC;
  ruc: string;
  dv: string;
  razonSocial: string;
  nombreComercial?: string;
  codigoSucursal: string;
  puntoFacturacion: string;
  direccion: string;
  codigoUbicacion: string;
  provincia: string;
  distrito: string;
  corregimiento: string;
  telefono?: string;
  correo?: string;
}

export interface ReceptorData {
  tipoRuc: TipoRUC;
  ruc: string;
  dv: string;
  tipoCliente: TipoCliente;
  razonSocial: string;
  direccion: string;
  codigoUbicacion?: string;
  provincia?: string;
  distrito?: string;
  corregimiento?: string;
  paisCodigo?: string; // Default: PA
  telefono?: string;
  correo?: string;
}

export interface ItemFactura {
  secuencia: number;
  descripcion: string;
  codigo: string;
  codigoCPBS?: string;
  unidadMedida: string;
  cantidad: number;
  precioUnitario: number;
  precioUnitarioDescuento?: number;
  precioItem: number;
  valorTotal: number;
  tasaITBMS: TasaITBMS;
  valorITBMS: number;
  tasaISC?: number;
  valorISC?: number;
  precioAcarreo?: number;
  precioSeguro?: number;
}

export interface TotalesFactura {
  totalNeto: number;
  totalITBMS: number;
  totalISC: number;
  totalGravado: number;
  totalDescuento: number;
  valorTotal: number;
  totalRecibido: number;
  vuelto?: number;
  tiempoPago: number; // 1 = Contado, 2 = Crédito
  numeroItems: number;
}

export interface FacturaElectronicaInput {
  // Información General
  ambiente: TipoAmbiente;
  tipoEmision: TipoEmision;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  puntoFacturacion: string;
  codigoSeguridad: string; // Número aleatorio de 8-9 dígitos
  fechaEmision: Date;
  fechaSalida?: Date;
  
  // Naturaleza de la operación
  naturalezaOperacion: string; // '01' = Venta
  tipoOperacion: string; // '1' = Compra-venta
  destino: string; // '1' = Panamá
  
  // Forma de pago
  formaPago: FormaPago;
  entregaCAFE: string; // '1' = Sí, '2' = No
  
  // Tipo de transacción
  tipoTransaccion: string; // '1' = Venta de bienes y servicios
  tipoSucursal: string; // '1' = Sucursal
  
  // Información adicional
  infoInteres?: string;
  
  // Partes
  emisor: EmisorData;
  receptor: ReceptorData;
  
  // Items
  items: ItemFactura[];
  
  // Totales
  totales: TotalesFactura;
  
  // Referencia (para notas de crédito/débito)
  referenciaDocumento?: {
    cufe: string;
    fechaEmision: Date;
    numeroDocumento: string;
  };
}

// ============================================
// GENERADOR DE CUFE
// ============================================

export function generarCUFE(data: FacturaElectronicaInput): string {
  const { tipoDocumento, emisor, numeroDocumento, puntoFacturacion, codigoSeguridad, ambiente } = data;
  
  const fecha = data.fechaEmision.toISOString().split('T')[0].replace(/-/g, '');
  
  return `FE${tipoDocumento}${ambiente === TipoAmbiente.DEMO ? '2' : '1'}0000${emisor.ruc}-${emisor.dv}00${fecha}${numeroDocumento}${puntoFacturacion}${codigoSeguridad}`;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function formatFecha(fecha: Date): string {
  // Formato: YYYY-MM-DDTHH:mm:ss-05:00 (zona horaria de Panamá)
  // Usa la utilidad de zona horaria para asegurar formato correcto
  return formatPanamaISO(fecha);
}

function formatDecimal(value: number, decimals: number = 2): string {
  // Validar que el valor sea un número válido
  if (value === null || value === undefined || isNaN(value)) {
    console.error(`⚠️  formatDecimal recibió valor inválido: ${value}`);
    return '0.00'; // Valor por defecto seguro
  }
  
  // Asegurar que sea un número finito
  const numValue = Number(value);
  if (!isFinite(numValue)) {
    console.error(`⚠️  formatDecimal recibió valor no finito: ${value}`);
    return '0.00';
  }
  
  return numValue.toFixed(decimals);
}

export function calcularValorITBMS(precioItem: number, tasa: TasaITBMS): number {
  const tasas: Record<TasaITBMS, number> = {
    [TasaITBMS.EXENTO]: 0,
    [TasaITBMS.TARIFA_0]: 0,
    [TasaITBMS.TARIFA_10]: 0.10,
    [TasaITBMS.TARIFA_15]: 0.15,
    [TasaITBMS.TARIFA_7]: 0.07,
  };
  
  return precioItem * tasas[tasa];
}

// ============================================
// GENERADOR PRINCIPAL DE XML
// ============================================

export function generarXMLFactura(data: FacturaElectronicaInput): string {
  const cufe = generarCUFE(data);
  
  // Crear documento XML
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rFE', { xmlns: 'http://dgi-fep.mef.gob.pa' });
  
  // ============================================
  // ENCABEZADO
  // ============================================
  doc.ele('dVerForm').txt('1.00').up();
  doc.ele('dId').txt(cufe).up();
  
  // ============================================
  // DATOS GENERALES
  // ============================================
  const gDGen = doc.ele('gDGen');
  gDGen.ele('iAmb').txt(data.ambiente.toString()).up();
  gDGen.ele('iTpEmis').txt(data.tipoEmision).up();
  gDGen.ele('dFechaCont').txt(formatFecha(data.fechaEmision)).up();
  gDGen.ele('iDoc').txt(data.tipoDocumento).up();
  gDGen.ele('dNroDF').txt(data.numeroDocumento).up();
  gDGen.ele('dPtoFacDF').txt(data.puntoFacturacion).up();
  gDGen.ele('dSeg').txt(data.codigoSeguridad).up();
  gDGen.ele('dFechaEm').txt(formatFecha(data.fechaEmision)).up();
  gDGen.ele('dFechaSalida').txt(formatFecha(data.fechaSalida || data.fechaEmision)).up();
  gDGen.ele('iNatOp').txt(data.naturalezaOperacion).up();
  gDGen.ele('iTipoOp').txt(data.tipoOperacion).up();
  gDGen.ele('iDest').txt(data.destino).up();
  gDGen.ele('iFormCAFE').txt(data.formaPago.toString()).up();
  gDGen.ele('iEntCAFE').txt(data.entregaCAFE).up();
  gDGen.ele('dEnvFE').txt('1').up(); // 1 = Envío electrónico
  gDGen.ele('iProGen').txt('1').up(); // 1 = Proceso generado
  gDGen.ele('iTipoTranVenta').txt(data.tipoTransaccion).up();
  gDGen.ele('iTipoSuc').txt(data.tipoSucursal).up();
  
  if (data.infoInteres) {
    gDGen.ele('dInfEmFE').txt(data.infoInteres).up();
  }
  
  // ============================================
  // DATOS DEL EMISOR
  // ============================================
  // Validar campos críticos del emisor
  if (!data.emisor.ruc || data.emisor.ruc.trim() === '') {
    throw new Error('El RUC del emisor es obligatorio y no puede estar vacío.');
  }
  if (!data.emisor.dv || data.emisor.dv.trim() === '') {
    throw new Error('El dígito verificador (DV) del emisor es obligatorio y no puede estar vacío.');
  }
  if (!data.emisor.razonSocial || data.emisor.razonSocial.trim() === '') {
    throw new Error('La razón social del emisor es obligatoria y no puede estar vacía.');
  }
  if (!data.emisor.direccion || data.emisor.direccion.trim() === '') {
    throw new Error('La dirección del emisor es obligatoria y no puede estar vacía.');
  }
  
  const gEmis = gDGen.ele('gEmis');
  const gRucEmi = gEmis.ele('gRucEmi');
  gRucEmi.ele('dTipoRuc').txt(data.emisor.tipoRuc).up();
  gRucEmi.ele('dRuc').txt(data.emisor.ruc.trim()).up(); // Asegurar sin espacios
  gRucEmi.ele('dDV').txt(data.emisor.dv.trim()).up(); // Asegurar sin espacios
  gRucEmi.up();
  
  gEmis.ele('dNombEm').txt(data.emisor.razonSocial.trim()).up(); // Asegurar sin espacios extra
  if (data.emisor.nombreComercial && data.emisor.nombreComercial.trim() !== '') {
    gEmis.ele('dNombComer').txt(data.emisor.nombreComercial.trim()).up();
  }
  gEmis.ele('dSucEm').txt(data.emisor.codigoSucursal.trim()).up();
  // ⚠️ CRÍTICO: NO incluir dCoordEm si está vacío - HKA rechaza campos vacíos
  // Si tiene coordenadas, agregarlas aquí
  gEmis.ele('dDirecEm').txt(data.emisor.direccion.trim()).up(); // Asegurar sin espacios extra
  
  // ⚠️ CRÍTICO: gUbiEmi es OBLIGATORIO y todos sus campos deben tener valores válidos
  // HKA rechaza si algún campo de ubicación está vacío
  const gUbiEmi = gEmis.ele('gUbiEmi');
  gUbiEmi.ele('dCodUbi').txt(data.emisor.codigoUbicacion || '8-1-1').up(); // Default: Panamá Centro
  gUbiEmi.ele('dCorreg').txt(data.emisor.corregimiento || 'SAN FELIPE').up(); // Default si no viene
  gUbiEmi.ele('dDistr').txt(data.emisor.distrito || 'PANAMA').up(); // Default si no viene
  gUbiEmi.ele('dProv').txt(data.emisor.provincia || 'PANAMA').up(); // Default si no viene
  gUbiEmi.up();
  
  if (data.emisor.correo) {
    gEmis.ele('dCorreoEm').txt(data.emisor.correo).up();
  }
  if (data.emisor.telefono) {
    gEmis.ele('dTfnEm').txt(data.emisor.telefono).up();
  }
  gEmis.up();
  
  // ============================================
  // DATOS DEL RECEPTOR
  // ============================================
  // Validar campos críticos del receptor
  if (!data.receptor.ruc || data.receptor.ruc.trim() === '') {
    throw new Error('El RUC del receptor es obligatorio y no puede estar vacío.');
  }
  if (!data.receptor.dv || data.receptor.dv.trim() === '') {
    throw new Error('El dígito verificador (DV) del receptor es obligatorio y no puede estar vacío.');
  }
  if (!data.receptor.razonSocial || data.receptor.razonSocial.trim() === '') {
    throw new Error('El nombre del receptor es obligatorio y no puede estar vacío.');
  }
  if (!data.receptor.direccion || data.receptor.direccion.trim() === '') {
    throw new Error('La dirección del receptor es obligatoria y no puede estar vacía.');
  }
  
  const gDatRec = gDGen.ele('gDatRec');
  gDatRec.ele('iTipoRec').txt(data.receptor.tipoCliente).up();
  
  const gRucRec = gDatRec.ele('gRucRec');
  gRucRec.ele('dTipoRuc').txt(data.receptor.tipoRuc).up();
  gRucRec.ele('dRuc').txt(data.receptor.ruc.trim()).up(); // Asegurar sin espacios
  gRucRec.ele('dDV').txt(data.receptor.dv.trim()).up(); // Asegurar sin espacios
  gRucRec.up();
  
  gDatRec.ele('dNombRec').txt(data.receptor.razonSocial.trim()).up(); // Asegurar sin espacios extra
  gDatRec.ele('dDirecRec').txt(data.receptor.direccion.trim()).up(); // Asegurar sin espacios extra
  
  // ⚠️ CRÍTICO: gUbiRec es OBLIGATORIO para receptores contribuyentes
  // Si no viene codigoUbicacion, usar valores por defecto para evitar campos vacíos
  const gUbiRec = gDatRec.ele('gUbiRec');
  gUbiRec.ele('dCodUbi').txt(data.receptor.codigoUbicacion || '8-1-1').up(); // Default: Panamá Centro
  gUbiRec.ele('dCorreg').txt(data.receptor.corregimiento || 'SAN FELIPE').up(); // Default si no viene
  gUbiRec.ele('dDistr').txt(data.receptor.distrito || 'PANAMA').up(); // Default si no viene
  gUbiRec.ele('dProv').txt(data.receptor.provincia || 'PANAMA').up(); // Default si no viene
  gUbiRec.up();
  
  if (data.receptor.telefono) {
    gDatRec.ele('dTfnRec').txt(data.receptor.telefono).up();
  }
  if (data.receptor.correo) {
    gDatRec.ele('dCorElectRec').txt(data.receptor.correo).up();
  }
  gDatRec.ele('cPaisRec').txt(data.receptor.paisCodigo || 'PA').up();
  gDatRec.up();
  
  gDGen.up(); // Cierra gDGen
  
  // ============================================
  // ITEMS DE LA FACTURA
  // ============================================
  // Validar que hay al menos un item
  if (!data.items || data.items.length === 0) {
    throw new Error('La factura debe tener al menos un item. No se pueden generar facturas sin items.');
  }
  
  data.items.forEach((item, index) => {
    // Validar campos críticos del item antes de generarlo
    if (!item.descripcion || item.descripcion.trim() === '') {
      throw new Error(`Item en posición ${index + 1} no tiene descripción. Todos los items deben tener descripción.`);
    }
    if (!item.codigo || item.codigo.trim() === '') {
      throw new Error(`Item "${item.descripcion}" no tiene código. Todos los items deben tener código.`);
    }
    if (!item.cantidad || item.cantidad <= 0) {
      throw new Error(`Item "${item.descripcion}" tiene cantidad inválida: ${item.cantidad}. La cantidad debe ser mayor a 0.`);
    }
    if (!item.precioUnitario || item.precioUnitario <= 0) {
      throw new Error(`Item "${item.descripcion}" tiene precio unitario inválido: ${item.precioUnitario}. El precio debe ser mayor a 0.`);
    }
    if (!item.unidadMedida || item.unidadMedida.trim() === '') {
      throw new Error(`Item "${item.descripcion}" no tiene unidad de medida. Debe especificar una unidad (ej: "und", "kg", "m").`);
    }
    
    const gItem = doc.ele('gItem');
    gItem.ele('dSecItem').txt(item.secuencia.toString()).up();
    gItem.ele('dDescProd').txt(item.descripcion.trim()).up(); // Asegurar sin espacios extra
    gItem.ele('dCodProd').txt(item.codigo.trim()).up(); // Asegurar código válido
    
    if (item.codigoCPBS) {
      gItem.ele('dCodCPBScmp').txt(item.codigoCPBS).up();
      gItem.ele('cUnidadCPBS').txt(item.unidadMedida).up();
    }
    
    gItem.ele('cUnidad').txt(item.unidadMedida.trim()).up(); // Asegurar unidad válida
    gItem.ele('dCantCodInt').txt(formatDecimal(item.cantidad)).up();
    
    // Validar que cantidad y precios sean números válidos
    if (isNaN(item.cantidad) || isNaN(item.precioUnitario)) {
      throw new Error(`Item "${item.descripcion}" tiene valores numéricos inválidos. Cantidad: ${item.cantidad}, Precio: ${item.precioUnitario}`);
    }
    
    const gPrecios = gItem.ele('gPrecios');
    gPrecios.ele('dPrUnit').txt(formatDecimal(item.precioUnitario)).up();
    gPrecios.ele('dPrUnitDesc').txt(formatDecimal(item.precioUnitarioDescuento || 0)).up();
    gPrecios.ele('dPrItem').txt(formatDecimal(item.precioItem)).up();
    gPrecios.ele('dValTotItem').txt(formatDecimal(item.valorTotal)).up();
    gPrecios.up();
    
    // ITBMS
    const gITBMSItem = gItem.ele('gITBMSItem');
    gITBMSItem.ele('dTasaITBMS').txt(item.tasaITBMS).up();
    gITBMSItem.ele('dValITBMS').txt(formatDecimal(item.valorITBMS)).up();
    gITBMSItem.up();
    
    // ISC (Impuesto Selectivo al Consumo)
    const gISCItem = gItem.ele('gISCItem');
    gISCItem.ele('dTasaISC').txt(formatDecimal(item.tasaISC || 0)).up();
    gISCItem.ele('dValISC').txt(formatDecimal(item.valorISC || 0)).up();
    gISCItem.up();
    
    gItem.up();
  });
  
  // ============================================
  // TOTALES
  // ============================================
  const gTot = doc.ele('gTot');
  gTot.ele('dTotNeto').txt(formatDecimal(data.totales.totalNeto)).up();
  gTot.ele('dTotITBMS').txt(formatDecimal(data.totales.totalITBMS)).up();
  gTot.ele('dTotISC').txt(formatDecimal(data.totales.totalISC)).up();
  gTot.ele('dTotGravado').txt(formatDecimal(data.totales.totalGravado)).up();
  gTot.ele('dTotDesc').txt(formatDecimal(data.totales.totalDescuento)).up();
  gTot.ele('dVTot').txt(formatDecimal(data.totales.valorTotal)).up();
  gTot.ele('dTotRec').txt(formatDecimal(data.totales.totalRecibido)).up();
  
  if (data.totales.vuelto) {
    gTot.ele('dVuelto').txt(formatDecimal(data.totales.vuelto)).up();
  }
  
  gTot.ele('iPzPag').txt(data.totales.tiempoPago.toString()).up();
  gTot.ele('dNroItems').txt(data.totales.numeroItems.toString()).up();
  gTot.up();
  
  // ============================================
  // REFERENCIA (Para Notas de Crédito/Débito)
  // ============================================
  if (data.referenciaDocumento) {
    const gRef = doc.ele('gRef');
    gRef.ele('dNaturalezaOp').txt('02').up(); // 02 = Nota de crédito
    gRef.ele('dMotEmi').txt('01').up(); // Motivo de emisión
    gRef.ele('dCufeRef').txt(data.referenciaDocumento.cufe).up();
    gRef.ele('dFechaRef').txt(formatFecha(data.referenciaDocumento.fechaEmision)).up();
    gRef.ele('dNumDocRef').txt(data.referenciaDocumento.numeroDocumento).up();
    gRef.up();
  }
  
  // Generar XML como string
  const xmlString = doc.end({ prettyPrint: true });
  
  return xmlString;
}

// ============================================
// FUNCIÓN DE AYUDA: CALCULAR TOTALES
// ============================================

export function calcularTotales(items: ItemFactura[], tiempoPago: number = 1): TotalesFactura {
  const totalNeto = items.reduce((sum, item) => sum + item.precioItem, 0);
  const totalITBMS = items.reduce((sum, item) => sum + item.valorITBMS, 0);
  const totalISC = items.reduce((sum, item) => sum + (item.valorISC || 0), 0);
  const totalDescuento = items.reduce((sum, item) => {
    const descuento = (item.precioUnitario - (item.precioUnitarioDescuento || item.precioUnitario)) * item.cantidad;
    return sum + descuento;
  }, 0);
  
  const valorTotal = totalNeto + totalITBMS + totalISC;
  
  return {
    totalNeto,
    totalITBMS,
    totalISC,
    // Base gravada: suma de importes antes de impuestos (precioItem)
    totalGravado: totalNeto,
    totalDescuento,
    valorTotal,
    totalRecibido: valorTotal,
    tiempoPago,
    numeroItems: items.length,
  };
}

// ============================================
// FUNCIÓN DE AYUDA: VALIDAR DATOS
// ============================================

export function validarDatosFactura(data: FacturaElectronicaInput): string[] {
  const errores: string[] = [];
  
  // Validar emisor
  if (!data.emisor.ruc || data.emisor.ruc.length < 10) {
    errores.push('RUC del emisor inválido');
  }
  if (!data.emisor.dv || data.emisor.dv.length < 1) {
    errores.push('DV del emisor inválido');
  }
  
  // Validar receptor
  if (!data.receptor.ruc) {
    errores.push('RUC del receptor requerido');
  }
  
  // Validar items
  if (data.items.length === 0) {
    errores.push('La factura debe tener al menos un item');
  }
  
  data.items.forEach((item, index) => {
    if (item.cantidad <= 0) {
      errores.push(`Item ${index + 1}: Cantidad debe ser mayor a 0`);
    }
    if (item.precioUnitario <= 0) {
      errores.push(`Item ${index + 1}: Precio unitario debe ser mayor a 0`);
    }
  });
  
  // Validar totales
  const totalesCalculados = calcularTotales(data.items, data.totales.tiempoPago);
  if (Math.abs(totalesCalculados.valorTotal - data.totales.valorTotal) > 0.01) {
    errores.push('El total calculado no coincide con el total proporcionado');
  }
  
  return errores;
}

// ============================================
// EJEMPLO DE USO (Para testing)
// ============================================

export function crearFacturaEjemplo(): FacturaElectronicaInput {
  const emisor: EmisorData = {
    tipoRuc: TipoRUC.PERSONA_JURIDICA,
    ruc: '155610034-2-2015',
    dv: '27',
    razonSocial: 'LA PAZ DUTY FREE S.A.',
    codigoSucursal: '0000',
    puntoFacturacion: '001',
    direccion: 'PANAMA',
    codigoUbicacion: '1-1-1',
    provincia: 'BOCAS DEL TORO',
    distrito: 'BOCAS DEL TORO',
    corregimiento: 'BASTIMENTOS',
  };
  
  const receptor: ReceptorData = {
    tipoRuc: TipoRUC.PERSONA_JURIDICA,
    ruc: '155610034-2-2015',
    dv: '27',
    tipoCliente: TipoCliente.CONTRIBUYENTE,
    razonSocial: 'CLIENTE EJEMPLO S.A.',
    direccion: 'PANAMA',
    paisCodigo: 'PA',
  };
  
  const items: ItemFactura[] = [
    {
      secuencia: 1,
      descripcion: 'LATTAFA MAYAR EDP/D 100ML',
      codigo: '732496',
      unidadMedida: 'und',
      cantidad: 96,
      precioUnitario: 26,
      precioUnitarioDescuento: 24.70,
      precioItem: 2371.20,
      valorTotal: 2371.20,
      tasaITBMS: TasaITBMS.EXENTO,
      valorITBMS: 0,
    },
  ];
  
  const totales = calcularTotales(items);
  
  const facturaInput: FacturaElectronicaInput = {
    ambiente: TipoAmbiente.DEMO,
    tipoEmision: TipoEmision.NORMAL,
    tipoDocumento: TipoDocumento.FACTURA,
    numeroDocumento: '0000000040',
    puntoFacturacion: '001',
    codigoSeguridad: String(Math.floor(Math.random() * 900000000) + 100000000),
    fechaEmision: new Date(),
    naturalezaOperacion: '01',
    tipoOperacion: '1',
    destino: '1',
    formaPago: FormaPago.EFECTIVO,
    entregaCAFE: '2',
    tipoTransaccion: '1',
    tipoSucursal: '1',
    emisor,
    receptor,
    items,
    totales,
  };
  
  return facturaInput;
}

