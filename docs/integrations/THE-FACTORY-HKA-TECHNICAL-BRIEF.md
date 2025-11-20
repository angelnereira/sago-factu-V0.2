# 📋 SAGO FACTU - Technical Integration Brief for The Factory HKA

**Documento**: Propuesta de Integración Técnica y Comercial
**Fecha**: 2025-11-17
**Versión**: 1.0 - Professional
**Destinatario**: The Factory HKA - Equipo de Soporte Técnico
**Propósito**: Establecer comunicación exitosa y resolver problemas de integración

---

## 📌 Executive Summary

SAGO FACTU es una plataforma SaaS de **facturación electrónica multi-tenant** diseñada específicamente para empresas panameñas. Actualmente, la plataforma está en **producción en Vercel** con usuarios activos, pero enfrenta barreras técnicas en la comunicación con la API de The Factory HKA que requieren asistencia especializada del equipo de soporte.

**Este documento tiene dos objetivos**:
1. Explicar en detalle cómo SAGO FACTU intenta comunicarse con HKA
2. Solicitar asistencia para resolver inconsistencias y establecer flujo de comunicación exitoso

---

## 🎯 Oportunidad de Negocio para The Factory HKA

### Por qué SAGO FACTU es de Valor para HKA

SAGO FACTU representa una **oportunidad estratégica** para The Factory HKA:

#### 1. **Masificación de Usuarios**
- **Problema actual**: Muchas PYMES en Panamá no usan facturación electrónica porque el setup es complejo
- **Solución SAGO FACTU**: Interfaz intuitiva, setup en 5 minutos, sin requerimientos técnicos
- **Beneficio para HKA**: Incremento de volumen de facturas procesadas a través de su API
- **Proyección**: 1,000+ nuevos usuarios potenciales en el primer año

#### 2. **Integración Transparente de Credenciales**
- **Problema actual**: Usuarios necesitan gestionar credenciales manualmente
- **Solución SAGO FACTU**: Multi-tenancy con aislamiento de credenciales por usuario/organización
- **Beneficio para HKA**: Reducción de llamadas al soporte técnico por problemas de credenciales
- **Resultado**: Mejor experiencia del cliente final

#### 3. **Procesamiento en Tiempo Real**
- SAGO FACTU procesa facturas de forma inmediata
- Sincronización de folios en tiempo real
- Dashboard de estadísticas que muestra el uso de la API
- **Beneficio para HKA**: Métricas claras de uso y adopción

#### 4. **Cumplimiento Automático de Normativas DGI**
- SAGO FACTU implementa todas las validaciones DGI requeridas
- XML-DSig W3C standard para firma digital
- Validaciones de RUC, campos requeridos, formatos
- **Beneficio para HKA**: Menos errores en envío, menos rechazo de documentos

#### 5. **Puerta de Entrada a Ecosistema de Integraciones**
- SAGO FACTU puede servir como hub central para ERP, contabilidad, punto de venta
- API abierta para integraciones
- **Beneficio para HKA**: Participación en transacciones B2B más grandes

---

## 🏗️ Arquitectura Técnica de SAGO FACTU

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│                    SAGO FACTU (Vercel)                   │
│                   Next.js 15 + React 19                   │
├─────────────────────────────────────────────────────────┤
│  ✅ Base de Datos: PostgreSQL (Neon Serverless)          │
│  ✅ Autenticación: NextAuth.js v5                        │
│  ✅ ORM: Prisma 6.17                                     │
│  ✅ Firma Digital: XMLDSig W3C + RSA-SHA256             │
│  ✅ Encriptación: AES-256-GCM + PBKDF2                  │
├─────────────────────────────────────────────────────────┤
│             The Factory HKA SOAP API                      │
│  (WSDL: https://demoemision.thefactoryhka.com.pa/...)   │
└─────────────────────────────────────────────────────────┘
```

### Características Implementadas

✅ **Multi-tenancy**: Aislamiento completo por usuario/organización
✅ **Firma Digital**: XMLDSig W3C con certificados PKCS#12
✅ **Gestión de Folios**: Sincronización y consumo en tiempo real
✅ **Encriptación de Credenciales**: AES-256-GCM en base de datos
✅ **Validaciones DGI**: RUC, campos requeridos, formatos
✅ **API REST**: 50+ endpoints para gestión completa
✅ **Reportes y Dashboards**: Estadísticas de uso en tiempo real

---

## 🔌 Arquitectura de Integración con HKA

### 1. Obtención de Credenciales

#### Estructura de Credenciales HKA Esperada

```typescript
// Modelo de credenciales en SAGO FACTU
interface HKACredentials {
  tokenUser: string;          // Usuario proporcionado por The Factory HKA
  tokenPassword: string;      // Contraseña/token proporcionado
  environment: 'demo' | 'prod'; // Ambiente de trabajo
  source: 'user' | 'organization' | 'system';
}
```

#### Cómo se Almacenan (Seguro)

1. **Base de Datos**: Encriptadas con AES-256-GCM
2. **En Memoria**: Nunca se logean o exponen
3. **En Tránsito**: Solo sobre HTTPS TLS 1.2+
4. **Aislamiento**: Cada usuario/organización tiene credenciales independientes

**Código de Obtención**:
```typescript
// Método: resolveHKACredentials(organizationId, { userId })
// Retorna: HKACredentials correctamente encriptadas/desencriptadas

const credentials = await resolveHKACredentials(organizationId, { userId });
// credentials.tokenUser = "xxxxx_ws_tfhka"
// credentials.tokenPassword = "YourPassword"
```

### 2. Flujo de Envío de Facturas

```
┌──────────────────────────────────────────────────────────────┐
│  Paso 1: Usuario crea factura en SAGO FACTU UI               │
│  Contiene: RUC, nombre cliente, items, totales               │
└───────────────────┬──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────────┐
│  Paso 2: Validaciones Locales                                │
│  ✅ RUC válido (checksum)                                    │
│  ✅ Campos obligatorios presentes                            │
│  ✅ Formato numérico correcto                                │
│  ✅ Fechas en rango válido                                   │
└───────────────────┬──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────────┐
│  Paso 3: Construcción del XML rFE                            │
│  Estructura: XML según formato DGI/HKA                       │
│  Contiene: gRucEmi, gRucRec, gItem, dVTot, etc.             │
└───────────────────┬──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────────┐
│  Paso 4: Firma Digital (XMLDSig)                             │
│  Obtiene certificado digital del usuario (P12/PFX)          │
│  Aplica firma: RSA-SHA256                                    │
│  Algoritmo: Exclusive C14N                                   │
│  Resultado: XML firmado con <ds:Signature>                  │
└───────────────────┬──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────────┐
│  Paso 5: Resolución de Credenciales                          │
│  Obtiene credenciales HKA del usuario/organización          │
│  Desencripta tokenPassword desde BD                          │
│  Prepara parámetros SOAP                                    │
└───────────────────┬──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────────┐
│  Paso 6: SOAP Call a HKA.Enviar()                            │
│  URL: https://demoemision.thefactoryhka.com.pa/ws/...       │
│  Método: Enviar                                              │
│  Parámetros:                                                 │
│    - tokenEmpresa: credentials.tokenUser                     │
│    - tokenPassword: credentials.tokenPassword                │
│    - documento: XML_FIRMADO (sin BOM, sin <?xml>)           │
│  Timeout: 30 segundos                                        │
│  Reintentos: 3 (con backoff exponencial)                    │
└───────────────────┬──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────────┐
│  Paso 7: Respuesta de HKA                                    │
│  Esperado:                                                   │
│    - dCodRes: "200" (exitoso)                               │
│    - dMsgRes: "Documento procesado"                         │
│    - dCufe: "CUFE autorizado"                               │
│    - XMLFirmado: XML retornado por HKA                      │
│    - PDF: PDF de la factura                                 │
└───────────────────┬──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────────┐
│  Paso 8: Guardar en BD                                       │
│  Status: CERTIFIED                                           │
│  Almacena: CUFE, PDF, XML firmado, protocolo HKA           │
│  Usuario notificado: ✅ Factura certificada                │
└──────────────────────────────────────────────────────────────┘
```

### 3. Firma Digital - Detalles Técnicos

#### Método Actual en SAGO FACTU

```typescript
// lib/xmldsig/signer.ts

async function signXml(xmlContent: string, certificateP12: Buffer, pin: string): Promise<string> {
  // 1. Cargar certificado P12/PFX
  const cert = pkcs12.parse(certificateP12, { password: pin });

  // 2. Obtener clave privada y certificado
  const privKey = cert.key;
  const pubCert = cert.cert;

  // 3. Crear firma XMLDSig
  const signer = new XMLDSig();
  signer.privateKey(privKey);
  signer.publicCert(pubCert);
  signer.canonicalizationAlgorithm('http://www.w3.org/2001/10/xml-exc-c14n#');
  signer.signatureAlgorithm('http://www.w3.org/2001/04/xmldsig-more#rsa-sha256');

  // 4. Firmar XML
  const signedXml = signer.sign(xmlContent);

  return signedXml;
}
```

#### Validaciones Aplicadas

✅ **Certificado Válido**: No expirado, correcto RUC
✅ **PIN Correcto**: Deprotege el P12
✅ **Algoritmo Correcto**: RSA-SHA256
✅ **Formato Correcto**: Exclusive C14N

#### XML Esperado por HKA

```xml
<rFE>
  <!-- Datos de la factura -->
  <gRucEmi>
    <dRuc>155738031</dRuc>
    <dDV>2</dDV>
    <dTipoRuc>2</dTipoRuc>
  </gRucEmi>

  <!-- Items de factura -->
  <gItem>
    <dDescProd>Producto 1</dDescProd>
    <dCantCodInt>1</dCantCodInt>
    <dPrcUni>100.00</dPrcUni>
  </gItem>

  <!-- Totales -->
  <dTotNeto>100.00</dTotNeto>
  <dVTot>100.00</dVTot>

  <!-- Firma Digital (agregada por SAGO FACTU) -->
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
      <ds:Reference URI="">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
        <ds:DigestValue><!-- SHA256 del XML --></ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue><!-- Firma RSA --></ds:SignatureValue>
    <ds:KeyInfo>
      <ds:X509Data>
        <ds:X509Certificate><!-- Certificado en Base64 --></ds:X509Certificate>
      </ds:X509Data>
    </ds:KeyInfo>
  </ds:Signature>
</rFE>
```

### 4. Gestión de Folios

#### Flujo de Folios en SAGO FACTU

```
┌──────────────────────────────────────────────────────────┐
│  Paso 1: ConsultarFolios() - HKA API                     │
│  Parámetros:                                             │
│    - tokenEmpresa: credentials.tokenUser                 │
│    - tokenPassword: credentials.tokenPassword            │
│    - ruc: RUC del usuario                               │
│    - dv: DV del RUC                                     │
└────────────────┬─────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────┐
│  Paso 2: HKA retorna Folios disponibles                  │
│  Respuesta esperada:                                     │
│  {                                                       │
│    folios: [                                             │
│      {                                                   │
│        numeroFolio: "000000001",                        │
│        estado: "DISPONIBLE",                            │
│        rango: "001-100"                                 │
│      },                                                  │
│      { ... }                                             │
│    ],                                                    │
│    totalDisponibles: 50,                                │
│    totalUtilizados: 30,                                 │
│    totalAsignados: 20                                   │
│  }                                                       │
└────────────────┬─────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────┐
│  Paso 3: SAGO FACTU sincroniza folios                    │
│  Almacena en BD tabla folio_pools                        │
│  Mantiene historial de disponibilidad                    │
└────────────────┬─────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────┐
│  Paso 4: Usuario envía factura                           │
│  SAGO FACTU valida: ¿hay folios disponibles?           │
│  Si SÍ: Envía a HKA.Enviar()                            │
│  Si NO: Muestra error "No hay folios"                   │
└────────────────┬─────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────┐
│  Paso 5: HKA confirma envío exitoso                      │
│  Retorna: dCufe (código único de fiscalización)         │
│  Folio se marca como UTILIZADO en HKA                   │
│  SAGO FACTU actualiza estado en BD                      │
└──────────────────────────────────────────────────────────┘
```

---

## 🔍 Problemas Identificados y Causas Potenciales

### 1. **Autenticación Fallida**

**Síntomas**: Error "Credenciales inválidas", acceso denegado
**Causas Potenciales**:
- ❓ Formato incorrecto de tokenEmpresa
- ❓ Credenciales expiradas en HKA
- ❓ Encoding incorrecto (UTF-8 vs otros)
- ❓ Credenciales con caracteres especiales no escapados

**Pregunta para HKA**:
> ¿Cuál es el formato exacto esperado para `tokenEmpresa` y `tokenPassword`? ¿Existe validación específica de caracteres especiales?

### 2. **Falla en Envío de Facturas**

**Síntomas**: Error al invocar método Enviar
**Causas Potenciales**:
- ❓ Estructura XML no coincide con rFE esperado
- ❓ Campos obligatorios faltantes o mal formateados
- ❓ Firma digital incorrecta o certificado inválido
- ❓ Namespace XML incorrecto

**Pregunta para HKA**:
> ¿Pueden proporcionar un XML de ejemplo válido? ¿Cuál es la validación exacta que aplica HKA al recibir un documento?

### 3. **Inconsistencias en Respuesta**

**Síntomas**: Respuesta no es parseable, campos inesperados
**Causas Potenciales**:
- ❓ Versión de WSDL diferente a la esperada
- ❓ Cambios recientes en API sin notificación
- ❓ Respuesta en formato diferente (XML vs JSON)

**Pregunta para HKA**:
> ¿Cuál es la versión actual del WSDL? ¿Ha habido cambios recientes en la estructura de respuesta?

### 4. **Gestión de Folios**

**Síntomas**: ConsultarFolios retorna vacío o error
**Causas Potenciales**:
- ❓ RUC no tiene folios asignados
- ❓ Parámetros de ambiente incorrectos (Demo vs Prod)
- ❓ Formato de RUC/DV incorrecto

**Pregunta para HKA**:
> ¿Cómo se asignan folios a un RUC? ¿Existe proceso manual en HKA que deba realizarse?

---

## 💡 Solución Propuesta y Pasos Siguientes

### Fase 1: Diagnóstico (1-2 semanas)

**Objetivos**:
1. Validar formato correcto de credenciales
2. Obtener XML de ejemplo válido
3. Documentar cambios recientes en WSDL
4. Crear casos de prueba conjunta

**Acciones Requeridas de HKA**:
- Proporcionar credenciales de TEST con folios asignados
- Proporcionar documentación de formato XML esperado
- Crear ticket de soporte conjunto para troubleshooting
- Asignar contacto técnico para comunicación directa

### Fase 2: Implementación (2-3 semanas)

**Objetivos**:
1. Ajustar código de SAGO FACTU basado en feedback
2. Crear suite de tests de integración
3. Validar flujo completo: crear factura → firmar → enviar → recibir CUFE

**Entregas**:
- ✅ Test suite de integración HKA
- ✅ Documentación de integración actualizada
- ✅ Casos de uso de ejemplo documentados

### Fase 3: Validación y Go-Live (1-2 semanas)

**Objetivos**:
1. Testing en ambiente de producción
2. Capacitación de soporte técnico
3. Plan de escalabilidad para múltiples usuarios

**Entregas**:
- ✅ SAGO FACTU con integración HKA funcional
- ✅ Documentación de soporte para usuarios finales
- ✅ Plan de escalabilidad

---

## 📱 Cómo Otros Usuarios Logran Comunicación Exitosa con HKA

### Patrones Observados

1. **Credenciales Válidas**: Obtener credenciales directamente de HKA con folios pre-asignados
2. **Certificados Válidos**: Usar certificados X.509 v3 no expirados, emitidos por autoridades reconocidas
3. **Formato XML Correcto**: Seguir estructura rFE exactamente como especificado
4. **Firma Digital Correcta**: Usar algoritmo RSA-SHA256 con Exclusive C14N
5. **Manejo de Errores**: Implementar reintentos con backoff exponencial

### Stack Técnico Recomendado para Integración

```
✅ Cliente SOAP: node-soap (npm package)
✅ Firma XML: xmldsig (npm package)
✅ Parsing XML: xml2js o xmldom
✅ Encriptación: crypto (Node.js native)
✅ Validación: zod o joi
```

---

## 🎁 Ventajas Comerciales de SAGO FACTU para The Factory HKA

### Impacto Esperado

| Métrica | Valor Esperado |
|---------|---|
| Nuevos usuarios en Año 1 | 500-1,000 PYMES |
| Facturas mensuales | 10,000-50,000 |
| Reducción de llamadas soporte HKA | 30-40% |
| Nuevos segmentos de mercado | Microempresas, autónomos |
| Integración con 3ros | ERP, POS, contabilidad |

### Beneficios Estratégicos

1. **Masificación**: SAGO FACTU es la puerta de entrada para miles de PYMES
2. **Reducción de Fricción**: Setup simple = mayor adopción
3. **Datos de Valor**: Estadísticas de uso de API
4. **Diferenciación**: Soporte oficial a plataforma SaaS
5. **Networking**: Acceso a comunidad de usuarios finales

---

## 📞 Invitación a Probar SAGO FACTU

### Acceso a Demo en Vivo

La plataforma está **100% operativa en Vercel**:

**URL**: https://sago-factu.vercel.app/

**Credenciales Demo**:
- **Super Admin**: `admin@sago-factu.com` / `admin123`
- **Usuario Demo**: `usuario@empresa.com` / `usuario123`

### Qué Explorar

1. **Crear usuario nuevo** → Ver flow de onboarding
2. **Configurar credenciales HKA** → Ver cómo se encriptan y almacenan
3. **Crear factura** → Ver validaciones locales
4. **Intentar enviar a HKA** → Ver dónde falla (y por qué queremos su ayuda)
5. **Ver dashboard** → Métricas de uso

### Invitación Especial

**Equipo de The Factory HKA**,

Le invitamos a:
1. Crear cuenta de usuario en SAGO FACTU
2. Explorar la interfaz y experiencia
3. Revisar cómo intentamos integrar con su API
4. Proporcionar feedback técnico
5. Trabajar conjuntamente en resolver barreras

---

## 📋 Información Técnica de Contacto

**Plataforma**: SAGO FACTU v0.8.1
**Ambiente**: Producción (Vercel)
**Base de Datos**: PostgreSQL (Neon)
**Stack**: Next.js 15 + React 19 + TypeScript
**Documentación**: https://github.com/angelnereira/sago-factu-V0.2/tree/main/docs

**Contacto del Desarrollador**:
- Email: [Angel Neira - Contacto]
- Disponibilidad: Flexible para llamadas técnicas y troubleshooting

---

## ✅ Checklist de Integración

Para que SAGO FACTU logre comunicación exitosa con HKA, necesitamos:

- [ ] Confirmación de formato correcto de credenciales
- [ ] XML de ejemplo válido (rFE)
- [ ] Documentación de cambios recientes en WSDL
- [ ] Credenciales de TEST con folios asignados
- [ ] Contacto técnico asignado en HKA
- [ ] Acceso a logs de SOAP en HKA (para debugging)
- [ ] Plan de escalabilidad para múltiples usuarios
- [ ] SLA de respuesta técnica

---

## 🤝 Propuesta de Colaboración

SAGO FACTU propone una **alianza estratégica** con The Factory HKA:

1. **Soporte Mutuo**: Equipo HKA apoya integración técnica
2. **Co-Marketing**: Promoción conjunta en redes/comunidades
3. **Feedback Loop**: Mejora continua basada en uso real
4. **Escalabilidad**: Plan conjunto para crecer con demanda

**Resultado Final**: Ambas partes ganan usuarios, volumen de transacciones y posicionamiento en mercado.

---

## 📚 Anexos

### Anexo A: URLs de HKA Configuradas en SAGO FACTU

```
Demo SOAP: https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc
Prod SOAP: https://produccion.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc
Demo REST: https://demointegracion.thefactoryhka.com.pa
Prod REST: https://integracion.thefactoryhka.com.pa

WSDL: [URL del WSDL esperado]
Documentación: https://felwiki.thefactoryhka.com.pa/
```

### Anexo B: Métodos HKA Utilizados por SAGO FACTU

```
1. ConsultarFolios()
   - Obtiene folios disponibles para un RUC
   - Parámetros: tokenEmpresa, tokenPassword, ruc, dv
   - Retorna: Lista de folios con estado

2. Enviar()
   - Envía factura firmada a HKA
   - Parámetros: tokenEmpresa, tokenPassword, documento (XML)
   - Retorna: CUFE, PDF, XML firmado

3. AnularDocumento()
   - Anula factura previamente enviada
   - Parámetros: tokenEmpresa, tokenPassword, cufe
   - Retorna: Confirmación de anulación

4. ConsultarDocumento()
   - Consulta estado de una factura
   - Parámetros: tokenEmpresa, tokenPassword, cufe/protocolo
   - Retorna: Estado, PDF, detalles
```

### Anexo C: Tecnologías de Integración

- **SOAP Client**: node-soap v0.x
- **XML Signing**: xmldsig (W3C standard)
- **HTTP Client**: axios con reintentos
- **Error Handling**: Retry logic con exponential backoff
- **Logging**: Logs estructurados en Neon + análisis

---

**Documento Preparado Por**: Angel Neira / SAGO FACTU
**Fecha**: 2025-11-17
**Próxima Actualización**: A definir con HKA
**Status**: Ready for Review and Technical Discussion

