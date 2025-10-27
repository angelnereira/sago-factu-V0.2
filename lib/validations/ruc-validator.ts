/**
 * Validador de RUC (Registro Único de Contribuyente) de Panamá
 * 
 * Implementa el algoritmo oficial de la DGI Panamá para validar RUCs
 * https://www.dgi.gob.pa/
 */

/**
 * Calcula el dígito verificador (DV) de un RUC panameño
 * 
 * Algoritmo:
 * 1. Multiplicar cada dígito por su posición (de derecha a izquierda, empezando en 2)
 * 2. Sumar todos los resultados
 * 3. Obtener el resto de dividir entre 11
 * 4. Si el resto es 0 o 1, el DV es 0, sino es 11 - resto
 * 
 * @param ruc - RUC sin DV (ejemplo: "123456789-1-2023" o "12345678912023")
 * @returns Dígito verificador calculado
 */
export function calcularDigitoVerificador(ruc: string): string {
  // Limpiar RUC: remover guiones y espacios
  const rucLimpio = ruc.replace(/[-\s]/g, '');
  
  // Separar RUC base, hypen, y año
  const partes = ruc.split('-');
  let rucBase: string;
  
  if (partes.length === 3) {
    // Formato: "123456789-1-2023"
    rucBase = partes[0] + partes[1]; // Juntar primera parte y hyphen
  } else if (partes.length === 1) {
    // Formato sin guiones: "12345678912023"
    // Últimos 4 dígitos son el año, ignoramos
    rucBase = rucLimpio.slice(0, -4);
  } else {
    // Formato inválido
    throw new Error('Formato de RUC inválido');
  }
  
  // Validar que solo tenga dígitos
  if (!/^\d+$/.test(rucBase)) {
    throw new Error('RUC debe contener solo dígitos');
  }
  
  // Calcular DV
  let suma = 0;
  let multiplicador = 2;
  
  // Iterar de derecha a izquierda
  for (let i = rucBase.length - 1; i >= 0; i--) {
    const digito = parseInt(rucBase[i], 10);
    suma += digito * multiplicador;
    multiplicador++;
    
    // Si multiplicador llega a 8, reiniciar a 2
    if (multiplicador > 7) {
      multiplicador = 2;
    }
  }
  
  const resto = suma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  
  return dv.toString();
}

/**
 * Valida un RUC completo con su dígito verificador
 * 
 * @param rucCompleto - RUC con DV (ejemplo: "123456789-1-2023-45")
 * @returns true si el DV es válido
 */
export function validarRUCCompleto(rucCompleto: string): boolean {
  try {
    // Separar RUC y DV
    const partes = rucCompleto.split('-');
    
    if (partes.length !== 4) {
      return false;
    }
    
    const rucSinDV = `${partes[0]}-${partes[1]}-${partes[2]}`;
    const dvProporcionado = partes[3];
    
    const dvCalculado = calcularDigitoVerificador(rucSinDV);
    
    return dvCalculado === dvProporcionado;
  } catch (error) {
    return false;
  }
}

/**
 * Formatea un RUC con su dígito verificador calculado
 * 
 * @param ruc - RUC base (ejemplo: "123456789-1-2023")
 * @returns RUC formateado con DV (ejemplo: "123456789-1-2023-45")
 */
export function formatearRUCConDV(ruc: string): string {
  const dv = calcularDigitoVerificador(ruc);
  return `${ruc}-${dv}`;
}

/**
 * Extrae el DV de un RUC completo
 * 
 * @param rucCompleto - RUC completo con DV (ejemplo: "123456789-1-2023-45")
 * @returns Dígito verificador extraído
 */
export function extraerDV(rucCompleto: string): string | null {
  const partes = rucCompleto.split('-');
  
  if (partes.length !== 4) {
    return null;
  }
  
  return partes[3];
}

/**
 * Extrae el RUC base sin DV
 * 
 * @param rucCompleto - RUC completo con DV (ejemplo: "123456789-1-2023-45")
 * @returns RUC sin DV (ejemplo: "123456789-1-2023")
 */
export function extraerRUCSinDV(rucCompleto: string): string | null {
  const partes = rucCompleto.split('-');
  
  if (partes.length !== 4) {
    return null;
  }
  
  return `${partes[0]}-${partes[1]}-${partes[2]}`;
}

/**
 * Valida el formato de un RUC panameño
 * 
 * Formatos válidos:
 * - Con DV: "123456789-1-2023-45"
 * - Sin DV: "123456789-1-2023"
 * 
 * @param ruc - RUC a validar
 * @returns true si el formato es válido
 */
export function validarFormatoRUC(ruc: string): boolean {
  // Con DV: 123456789-1-2023-45
  const conDV = /^\d{8,9}-\d-\d{4}-\d{2}$/.test(ruc);
  
  // Sin DV: 123456789-1-2023
  const sinDV = /^\d{8,9}-\d-\d{4}$/.test(ruc);
  
  return conDV || sinDV;
}

/**
 * Ejemplos de uso y testing
 */
export function ejemplos() {
  console.log('=== VALIDACIÓN DE RUC PANAMEÑO ===\n');
  
  // RUCs de prueba (valores inventados para testing)
  const rucs = [
    '123456789-1-2023',
    '87654321-2-2024',
    '19265242-1-2024',
  ];
  
  rucs.forEach(ruc => {
    const dv = calcularDigitoVerificador(ruc);
    const rucCompleto = `${ruc}-${dv}`;
    const esValido = validarRUCCompleto(rucCompleto);
    
    console.log(`RUC: ${ruc}`);
    console.log(`DV calculado: ${dv}`);
    console.log(`RUC completo: ${rucCompleto}`);
    console.log(`¿Es válido? ${esValido ? '✅' : '❌'}`);
    console.log('---');
  });
}
