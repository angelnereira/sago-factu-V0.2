/**
 * Catálogo completo de ubicaciones válidas de Panamá para HKA/DGI
 * Formato de código: {provincia}-{distrito}-{corregimiento}
 * Ejemplo: 8-1-12 (Provincia 8, Distrito 1, Corregimiento 12)
 */

export interface Ubicacion {
  codigo: string; // Formato: X-Y-Z
  provincia: string;
  distrito: string;
  corregimiento: string;
}

/**
 * Catálogo completo de ubicaciones de Panamá
 * Basado en división administrativa oficial de la República de Panamá
 */
export const UBICACIONES_PANAMA: Ubicacion[] = [
  // ============================================
  // PROVINCIA DE PANAMÁ (8)
  // ============================================
  // Distrito de Panamá (1)
  { codigo: '8-1-1', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'SAN FELIPE' },
  { codigo: '8-1-2', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'EL CHORRILLO' },
  { codigo: '8-1-3', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'SANTA ANA' },
  { codigo: '8-1-4', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'CALIDONIA' },
  { codigo: '8-1-5', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'CURUNDÚ' },
  { codigo: '8-1-6', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'ANCON' },
  { codigo: '8-1-7', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'ALCALDE DÍAZ' },
  { codigo: '8-1-8', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'BETANIA' },
  { codigo: '8-1-9', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'BELLA VISTA' },
  { codigo: '8-1-10', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'JUAN DÍAZ' },
  { codigo: '8-1-11', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'PEDREGAL' },
  { codigo: '8-1-12', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'SAN FRANCISCO' },
  { codigo: '8-1-13', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'PARQUE LEFEVRE' },
  { codigo: '8-1-14', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'RÍO ABAJO' },
  { codigo: '8-1-15', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'SANTA LIBRADA' },
  { codigo: '8-1-16', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'LAS CUMBRES' },
  { codigo: '8-1-17', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'PACORA' },
  { codigo: '8-1-18', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'CHIMAN' },
  { codigo: '8-1-19', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'TOCUMEN' },
  { codigo: '8-1-20', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'LAS MAÑANITAS' },
  { codigo: '8-1-21', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'ERNESTO CORDOVES CAMPOS' },
  { codigo: '8-1-22', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'VERACRUZ' },
  { codigo: '8-1-23', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'VILLA CÁCERES' },
  { codigo: '8-1-24', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'VILLA LUZ' },
  { codigo: '8-1-25', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'VILLA ROSARIO' },
  { codigo: '8-1-26', provincia: 'PANAMÁ', distrito: 'PANAMÁ', corregimiento: 'VILLA ZAITA' },

  // Distrito de San Miguelito (2)
  { codigo: '8-2-1', provincia: 'PANAMÁ', distrito: 'SAN MIGUELITO', corregimiento: 'AMELIA DENIS DE ICAZA' },
  { codigo: '8-2-2', provincia: 'PANAMÁ', distrito: 'SAN MIGUELITO', corregimiento: 'BELISARIO PORRAS' },
  { codigo: '8-2-3', provincia: 'PANAMÁ', distrito: 'SAN MIGUELITO', corregimiento: 'JOSÉ DOMINGO ESPINAR' },
  { codigo: '8-2-4', provincia: 'PANAMÁ', distrito: 'SAN MIGUELITO', corregimiento: 'MATEO ITURRALDE' },
  { codigo: '8-2-5', provincia: 'PANAMÁ', distrito: 'SAN MIGUELITO', corregimiento: 'OMAR TORRIJOS' },
  { codigo: '8-2-6', provincia: 'PANAMÁ', distrito: 'SAN MIGUELITO', corregimiento: 'RUFINA ALFARO' },
  { codigo: '8-2-7', provincia: 'PANAMÁ', distrito: 'SAN MIGUELITO', corregimiento: 'VICTORIA' },
  { codigo: '8-2-8', provincia: 'PANAMÁ', distrito: 'SAN MIGUELITO', corregimiento: 'ARNULFO ARIAS' },
  { codigo: '8-2-9', provincia: 'PANAMÁ', distrito: 'SAN MIGUELITO', corregimiento: 'BELISARIO FRÍAS' },
  { codigo: '8-2-10', provincia: 'PANAMÁ', distrito: 'SAN MIGUELITO', corregimiento: 'CIUDAD DEL SOL' },
  { codigo: '8-2-11', provincia: 'PANAMÁ', distrito: 'SAN MIGUELITO', corregimiento: 'SAN MARTÍN' },

  // Distrito de Taboga (3)
  { codigo: '8-3-1', provincia: 'PANAMÁ', distrito: 'TABOGA', corregimiento: 'TABOGA' },
  { codigo: '8-3-2', provincia: 'PANAMÁ', distrito: 'TABOGA', corregimiento: 'OGÁS' },

  // Distrito de Chame (4)
  { codigo: '8-4-1', provincia: 'PANAMÁ', distrito: 'CHAME', corregimiento: 'CHAME' },
  { codigo: '8-4-2', provincia: 'PANAMÁ', distrito: 'CHAME', corregimiento: 'BEJUCO' },
  { codigo: '8-4-3', provincia: 'PANAMÁ', distrito: 'CHAME', corregimiento: 'BUENOS AIRES' },
  { codigo: '8-4-4', provincia: 'PANAMÁ', distrito: 'CHAME', corregimiento: 'CABUYA' },
  { codigo: '8-4-5', provincia: 'PANAMÁ', distrito: 'CHAME', corregimiento: 'CHICÁ' },
  { codigo: '8-4-6', provincia: 'PANAMÁ', distrito: 'CHAME', corregimiento: 'EL LÍBANO' },
  { codigo: '8-4-7', provincia: 'PANAMÁ', distrito: 'CHAME', corregimiento: 'LAS LLANAS' },
  { codigo: '8-4-8', provincia: 'PANAMÁ', distrito: 'CHAME', corregimiento: 'NUEVO GORGONA' },
  { codigo: '8-4-9', provincia: 'PANAMÁ', distrito: 'CHAME', corregimiento: 'SORA' },

  // Distrito de Chepo (5)
  { codigo: '8-5-1', provincia: 'PANAMÁ', distrito: 'CHEPO', corregimiento: 'CHEPO' },
  { codigo: '8-5-2', provincia: 'PANAMÁ', distrito: 'CHEPO', corregimiento: 'CAÑITA' },
  { codigo: '8-5-3', provincia: 'PANAMÁ', distrito: 'CHEPO', corregimiento: 'LAS MINAS' },
  { codigo: '8-5-4', provincia: 'PANAMÁ', distrito: 'CHEPO', corregimiento: 'CHEPILLO' },
  { codigo: '8-5-5', provincia: 'PANAMÁ', distrito: 'CHEPO', corregimiento: 'TORTÍ' },

  // Distrito de Chimán (6)
  { codigo: '8-6-1', provincia: 'PANAMÁ', distrito: 'CHIMÁN', corregimiento: 'CHIMÁN' },
  { codigo: '8-6-2', provincia: 'PANAMÁ', distrito: 'CHIMÁN', corregimiento: 'BRUJAS' },
  { codigo: '8-6-3', provincia: 'PANAMÁ', distrito: 'CHIMÁN', corregimiento: 'GONZALO VÁSQUEZ' },
  { codigo: '8-6-4', provincia: 'PANAMÁ', distrito: 'CHIMÁN', corregimiento: 'PASIGA' },

  // Distrito de Balboa (7)
  { codigo: '8-7-1', provincia: 'PANAMÁ', distrito: 'BALBOA', corregimiento: 'BALBOA' },
  { codigo: '8-7-2', provincia: 'PANAMÁ', distrito: 'BALBOA', corregimiento: 'SAMBÚ' },

  // Distrito de La Chorrera (8)
  { codigo: '8-8-1', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'LA CHORRERA' },
  { codigo: '8-8-2', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'BARRIO BALBOA' },
  { codigo: '8-8-3', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'BARRIO COLÓN' },
  { codigo: '8-8-4', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'AMADOR' },
  { codigo: '8-8-5', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'ARAÚZ' },
  { codigo: '8-8-6', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'EL COCO' },
  { codigo: '8-8-7', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'FEUILLET' },
  { codigo: '8-8-8', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'GUADALUPE' },
  { codigo: '8-8-9', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'HERRERA' },
  { codigo: '8-8-10', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'HURTADO' },
  { codigo: '8-8-11', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'ITURRALDE' },
  { codigo: '8-8-12', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'LA REPRESA' },
  { codigo: '8-8-13', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'LOS LLANOS' },
  { codigo: '8-8-14', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'MENDOZA' },
  { codigo: '8-8-15', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'OCÚ' },
  { codigo: '8-8-16', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'PALMA' },
  { codigo: '8-8-17', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'PIPE' },
  { codigo: '8-8-18', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'LOS ALAMOS' },
  { codigo: '8-8-19', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'EL ESPINO' },
  { codigo: '8-8-20', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'EL CAÑO' },
  { codigo: '8-8-21', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'CAMPANA' },
  { codigo: '8-8-22', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'CAPIRA' },
  { codigo: '8-8-23', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'CIRI DE LOS SOTOS' },
  { codigo: '8-8-24', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'CIRI GRANDE' },
  { codigo: '8-8-25', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'EL CIEGO' },
  { codigo: '8-8-26', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'ESPINO AMARILLO' },
  { codigo: '8-8-27', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'LAS MENDAS' },
  { codigo: '8-8-28', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'LLANO MARÍN' },
  { codigo: '8-8-29', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'LOS HIGOS' },
  { codigo: '8-8-30', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'QUEBRADA DEL ROSARIO' },
  { codigo: '8-8-31', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'SALADILLO' },
  { codigo: '8-8-32', provincia: 'PANAMÁ', distrito: 'LA CHORRERA', corregimiento: 'SANTA ROSA' },

  // Distrito de Capira (9)
  { codigo: '8-9-1', provincia: 'PANAMÁ', distrito: 'CAPIRA', corregimiento: 'CAPIRA' },
  { codigo: '8-9-2', provincia: 'PANAMÁ', distrito: 'CAPIRA', corregimiento: 'CIRI DE LOS SOTOS' },
  { codigo: '8-9-3', provincia: 'PANAMÁ', distrito: 'CAPIRA', corregimiento: 'LA TRINIDAD' },
  { codigo: '8-9-4', provincia: 'PANAMÁ', distrito: 'CAPIRA', corregimiento: 'LAS OLLAS ARRIBA' },
  { codigo: '8-9-5', provincia: 'PANAMÁ', distrito: 'CAPIRA', corregimiento: 'LIBERTAD' },
  { codigo: '8-9-6', provincia: 'PANAMÁ', distrito: 'CAPIRA', corregimiento: 'VILLA CARMEN' },
  { codigo: '8-9-7', provincia: 'PANAMÁ', distrito: 'CAPIRA', corregimiento: 'VILLA ROSARIO' },
  { codigo: '8-9-8', provincia: 'PANAMÁ', distrito: 'CAPIRA', corregimiento: 'CABUYA' },
  { codigo: '8-9-9', provincia: 'PANAMÁ', distrito: 'CAPIRA', corregimiento: 'LOS LLANOS' },

  // ============================================
  // PROVINCIA DE COLÓN (3)
  // ============================================
  { codigo: '3-1-1', provincia: 'COLÓN', distrito: 'COLÓN', corregimiento: 'COLÓN' },
  { codigo: '3-1-2', provincia: 'COLÓN', distrito: 'COLÓN', corregimiento: 'CRISTÓBAL' },
  { codigo: '3-1-3', provincia: 'COLÓN', distrito: 'COLÓN', corregimiento: 'CATORCE DE NOVIEMBRE' },
  { codigo: '3-1-4', provincia: 'COLÓN', distrito: 'COLÓN', corregimiento: 'NUEVA PROVIDENCIA' },
  { codigo: '3-1-5', provincia: 'COLÓN', distrito: 'COLÓN', corregimiento: 'SABANITAS' },
  { codigo: '3-1-6', provincia: 'COLÓN', distrito: 'COLÓN', corregimiento: 'CATIVÁ' },
  { codigo: '3-1-7', provincia: 'COLÓN', distrito: 'COLÓN', corregimiento: 'LIMÓN' },
  { codigo: '3-1-8', provincia: 'COLÓN', distrito: 'COLÓN', corregimiento: 'PUERTO PILÓN' },
  { codigo: '3-1-9', provincia: 'COLÓN', distrito: 'COLÓN', corregimiento: 'SANTA ROSA' },

  // ============================================
  // PROVINCIA DE CHIRIQUÍ (4)
  // ============================================
  { codigo: '4-1-1', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'DAVID' },
  { codigo: '4-1-2', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'LAS LOMAS' },
  { codigo: '4-1-3', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'SAN CARLOS' },
  { codigo: '4-1-4', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'SAN PABLO NUEVO' },
  { codigo: '4-1-5', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'SAN PABLO VIEJO' },
  { codigo: '4-1-6', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'DIVISA' },
  { codigo: '4-1-7', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'EL PROGRESO' },
  { codigo: '4-1-8', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'GUARUMAL' },
  { codigo: '4-1-9', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'LA CONCEPCIÓN' },
  { codigo: '4-1-10', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'SAN JUAN DE LA CONCEPCIÓN' },
  { codigo: '4-1-11', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'SAN MARTÍN DE PORRES' },
  { codigo: '4-1-12', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'POTRERO DE CALDERA' },
  { codigo: '4-1-13', provincia: 'CHIRIQUÍ', distrito: 'DAVID', corregimiento: 'CABEZA DE TORO' },

  // ============================================
  // PROVINCIA DE VERAGUAS (9)
  // ============================================
  { codigo: '9-1-1', provincia: 'VERAGUAS', distrito: 'SANTIAGO', corregimiento: 'SANTIAGO' },
  { codigo: '9-1-2', provincia: 'VERAGUAS', distrito: 'SANTIAGO', corregimiento: 'LA PEÑA' },
  { codigo: '9-1-3', provincia: 'VERAGUAS', distrito: 'SANTIAGO', corregimiento: 'SAN PEDRO DEL ESPINO' },
  { codigo: '9-1-4', provincia: 'VERAGUAS', distrito: 'SANTIAGO', corregimiento: 'CÁCERES' },
  { codigo: '9-1-5', provincia: 'VERAGUAS', distrito: 'SANTIAGO', corregimiento: 'LOS ALTOS' },
  { codigo: '9-1-6', provincia: 'VERAGUAS', distrito: 'SANTIAGO', corregimiento: 'SAN MARTÍN DE PORRES' },

  // ============================================
  // PROVINCIA DE HERRERA (7)
  // ============================================
  { codigo: '7-1-1', provincia: 'HERRERA', distrito: 'CHITRÉ', corregimiento: 'CHITRÉ' },
  { codigo: '7-1-2', provincia: 'HERRERA', distrito: 'CHITRÉ', corregimiento: 'LA ARENA' },
  { codigo: '7-1-3', provincia: 'HERRERA', distrito: 'CHITRÉ', corregimiento: 'MONAGRILLO' },
  { codigo: '7-1-4', provincia: 'HERRERA', distrito: 'CHITRÉ', corregimiento: 'SAN JUAN BAUTISTA' },

  // ============================================
  // PROVINCIA DE LOS SANTOS (6)
  // ============================================
  { codigo: '6-1-1', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'LAS TABLAS' },
  { codigo: '6-1-2', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'BAJO CORRAL' },
  { codigo: '6-1-3', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'BAYANO' },
  { codigo: '6-1-4', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'EL CARATE' },
  { codigo: '6-1-5', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'EL MUÑOZ' },
  { codigo: '6-1-6', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'EL PEDREGOSO' },
  { codigo: '6-1-7', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'LA LOMA' },
  { codigo: '6-1-8', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'LA MESA' },
  { codigo: '6-1-9', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'LA PALMA' },
  { codigo: '6-1-10', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'LA TIZA' },
  { codigo: '6-1-11', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'LAS PALMITAS' },
  { codigo: '6-1-12', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'PALO SECO' },
  { codigo: '6-1-13', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'SAN JOSÉ' },
  { codigo: '6-1-14', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'SAN MIGUEL' },
  { codigo: '6-1-15', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'SANTIAGO' },
  { codigo: '6-1-16', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'SANTIAGO VIEJO' },
  { codigo: '6-1-17', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'TONOSÍ' },
  { codigo: '6-1-18', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'TRILLO' },
  { codigo: '6-1-19', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'AGUA DUCE' },
  { codigo: '6-1-20', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'EL MANANTIAL' },
  { codigo: '6-1-21', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'EL MONTE' },
  { codigo: '6-1-22', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'EL PEDREGAL' },
  { codigo: '6-1-23', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'LA LAJA' },
  { codigo: '6-1-24', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'LA TRONOSA' },
  { codigo: '6-1-25', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'LAS GUABAS' },
  { codigo: '6-1-26', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'PITAL' },
  { codigo: '6-1-27', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'PRIOR' },
  { codigo: '6-1-28', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'RÍO HONDO' },
  { codigo: '6-1-29', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'SANTO DOMINGO' },
  { codigo: '6-1-30', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'VALLE RICO' },
  { codigo: '6-1-31', provincia: 'LOS SANTOS', distrito: 'LAS TABLAS', corregimiento: 'VALLE RICO NUEVO' },

  // ============================================
  // PROVINCIA DE COCLÉ (2)
  // ============================================
  { codigo: '2-1-1', provincia: 'COCLÉ', distrito: 'PENONOMÉ', corregimiento: 'PENONOMÉ' },
  { codigo: '2-1-2', provincia: 'COCLÉ', distrito: 'PENONOMÉ', corregimiento: 'CAÑAZAS' },
  { codigo: '2-1-3', provincia: 'COCLÉ', distrito: 'PENONOMÉ', corregimiento: 'COCLÉ' },
  { codigo: '2-1-4', provincia: 'COCLÉ', distrito: 'PENONOMÉ', corregimiento: 'EL COCO' },
  { codigo: '2-1-5', provincia: 'COCLÉ', distrito: 'PENONOMÉ', corregimiento: 'EL VALLE' },
  { codigo: '2-1-6', provincia: 'COCLÉ', distrito: 'PENONOMÉ', corregimiento: 'LLANO GRANDE' },
  { codigo: '2-1-7', provincia: 'COCLÉ', distrito: 'PENONOMÉ', corregimiento: 'NATA' },
  { codigo: '2-1-8', provincia: 'COCLÉ', distrito: 'PENONOMÉ', corregimiento: 'OLÁ' },
  { codigo: '2-1-9', provincia: 'COCLÉ', distrito: 'PENONOMÉ', corregimiento: 'RIO HATO' },

  // ============================================
  // PROVINCIA DE BOCAS DEL TORO (1)
  // ============================================
  { codigo: '1-1-1', provincia: 'BOCAS DEL TORO', distrito: 'BOCAS DEL TORO', corregimiento: 'BOCAS DEL TORO' },
  { codigo: '1-1-2', provincia: 'BOCAS DEL TORO', distrito: 'BOCAS DEL TORO', corregimiento: 'BASTIMENTOS' },
  { codigo: '1-1-3', provincia: 'BOCAS DEL TORO', distrito: 'BOCAS DEL TORO', corregimiento: 'CABAÑAS' },
  { codigo: '1-1-4', provincia: 'BOCAS DEL TORO', distrito: 'BOCAS DEL TORO', corregimiento: 'CAREÑERO' },
  { codigo: '1-1-5', provincia: 'BOCAS DEL TORO', distrito: 'BOCAS DEL TORO', corregimiento: 'TIERRA OSCURA' },

  // ============================================
  // PROVINCIA DE DARIÉN (5)
  // ============================================
  { codigo: '5-1-1', provincia: 'DARIÉN', distrito: 'LA PALMA', corregimiento: 'LA PALMA' },
  { codigo: '5-1-2', provincia: 'DARIÉN', distrito: 'LA PALMA', corregimiento: 'CAMOGANTI' },
  { codigo: '5-1-3', provincia: 'DARIÉN', distrito: 'LA PALMA', corregimiento: 'CHEPIGANA' },
  { codigo: '5-1-4', provincia: 'DARIÉN', distrito: 'LA PALMA', corregimiento: 'GARACHINÉ' },
  { codigo: '5-1-5', provincia: 'DARIÉN', distrito: 'LA PALMA', corregimiento: 'JAQUÉ' },
  { codigo: '5-1-6', provincia: 'DARIÉN', distrito: 'LA PALMA', corregimiento: 'PUERTO PILÓN' },
  { codigo: '5-1-7', provincia: 'DARIÉN', distrito: 'LA PALMA', corregimiento: 'RIO SABALO' },
  { codigo: '5-1-8', provincia: 'DARIÉN', distrito: 'LA PALMA', corregimiento: 'SETEGANTÍ' },

  // ============================================
  // COMARCAS Y REGIONES ESPECIALES
  // ============================================
  // Comarca Guna Yala (10)
  { codigo: '10-1-1', provincia: 'GUNA YALA', distrito: 'GUNA YALA', corregimiento: 'EL PORVENIR' },
  
  // Comarca Ngäbe-Buglé (11)
  { codigo: '11-1-1', provincia: 'NGÄBE-BUGLÉ', distrito: 'LITORAL', corregimiento: 'LLANOS DE TUGRI' },
  
  // Comarca Emberá-Wounaan (12)
  { codigo: '12-1-1', provincia: 'EMBERÁ-WOUNAAN', distrito: 'CÉMACO', corregimiento: 'UNIÓN CHOCÓ' },
];

/**
 * Obtiene ubicación por defecto válida (Panamá Centro)
 */
export function getDefaultUbicacion(): Ubicacion {
  return {
    codigo: '8-1-12',
    provincia: 'PANAMÁ',
    distrito: 'PANAMÁ',
    corregimiento: 'SAN FRANCISCO'
  };
}

/**
 * Busca ubicación por código
 */
export function findUbicacion(codigo: string): Ubicacion | null {
  return UBICACIONES_PANAMA.find(u => u.codigo === codigo) || null;
}

/**
 * Busca ubicación por provincia y distrito
 */
export function findUbicacionByProvinciaDistrito(
  provincia: string,
  distrito: string
): Ubicacion[] {
  return UBICACIONES_PANAMA.filter(
    u => u.provincia.toUpperCase() === provincia.toUpperCase() &&
         u.distrito.toUpperCase() === distrito.toUpperCase()
  );
}

/**
 * Valida si un código de ubicación es válido
 */
export function isValidUbicacion(codigo: string): boolean {
  return UBICACIONES_PANAMA.some(u => u.codigo === codigo);
}

/**
 * Obtiene ubicación válida o retorna la por defecto
 */
export function getUbicacionOrDefault(codigo?: string | null): Ubicacion {
  if (!codigo) {
    return getDefaultUbicacion();
  }

  const ubicacion = findUbicacion(codigo);
  if (ubicacion) {
    return ubicacion;
  }

  // Si el código no es válido, retornar por defecto
  return getDefaultUbicacion();
}

/**
 * Obtiene todas las provincias únicas
 */
export function getProvincias(): string[] {
  return Array.from(new Set(UBICACIONES_PANAMA.map(u => u.provincia))).sort();
}

/**
 * Obtiene todos los distritos de una provincia
 */
export function getDistritos(provincia: string): string[] {
  return Array.from(
    new Set(
      UBICACIONES_PANAMA
        .filter(u => u.provincia.toUpperCase() === provincia.toUpperCase())
        .map(u => u.distrito)
    )
  ).sort();
}

/**
 * Obtiene todos los corregimientos de un distrito
 */
export function getCorregimientos(provincia: string, distrito: string): string[] {
  return Array.from(
    new Set(
      UBICACIONES_PANAMA
        .filter(
          u => u.provincia.toUpperCase() === provincia.toUpperCase() &&
               u.distrito.toUpperCase() === distrito.toUpperCase()
        )
        .map(u => u.corregimiento)
    )
  ).sort();
}

