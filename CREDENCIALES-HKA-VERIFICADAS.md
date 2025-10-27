# ✅ CREDENCIALES HKA VERIFICADAS Y FUNCIONANDO

**Fecha:** 2025-10-27
**Estado:** ✅ CONFIGURADAS Y FUNCIONANDO

---

## 📋 CREDENCIALES DEMO (ACTUALES)

### Portal Web de Emisión
- **URL:** https://demo.thefactoryhka.com.pa/
- **Usuario:** soporte@ubicsys.com
- **Contraseña:** Cactus4obk01B$m

### Servicios Web (SOAP)
- **URL WSDL:** https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc?wsdl
- **Endpoint Base:** https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc
- **Token Usuario (TokenEmpresa):** walgofugiitj_ws_tfhka
- **Token Password:** Octopusp1oQs5

### Recursos Adicionales
- **Wiki/Documentación:** https://felwiki.thefactoryhka.com.pa/
- **WSDL Single:** https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc?singleWsdl

---

## ✅ VERIFICACIÓN DE CONEXIÓN

### Test de Conexión HKA
```bash
curl http://localhost:3001/api/hka/test-connection
```

**Respuesta:**
```json
{
  "success": true,
  "message": "✅ Conexión a HKA exitosa",
  "environment": "demo",
  "credentials": {
    "usuario": "walgofugiitj_ws_tfhka",
    "tokenEmpresa": "walgofugii..."
  },
  "timestamp": "2025-10-27T17:20:54.682Z"
}
```

---

## 🔐 CONFIGURACIÓN EN .env

```env
HKA_ENV="demo"
HKA_ENVIRONMENT="demo"
HKA_DEMO_SOAP_URL="https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc"
HKA_DEMO_TOKEN_USER="walgofugiitj_ws_tfhka"
HKA_DEMO_TOKEN_PASSWORD="Octopusp1oQs5"
HKA_DEMO_TOKEN_EMPRESA="walgofugiitj_ws_tfhka"
HKA_DEMO_WSDL_URL="https://demoemision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc?wsdl"
HKA_DEMO_REST_URL="https://demointegracion.thefactoryhka.com.pa"
```

---

## 🚀 PRÓXIMOS PASOS

### Para Producción
Cuando necesites cambiar a producción:

1. Solicitar credenciales a The Factory HKA
2. Actualizar estas variables en `.env`:
   ```
   HKA_ENV="production"
   HKA_PROD_SOAP_URL="https://emision.thefactoryhka.com.pa/ws/obj/v1.0/Service.svc"
   HKA_PROD_TOKEN_USER="tu_token_prod"
   HKA_PROD_TOKEN_PASSWORD="tu_password_prod"
   ```

---

## 📊 MÉTODOS HKA DISPONIBLES

Una vez configurado, puedes usar estos métodos:

1. **ConsultarFolios** - Ver folios disponibles
2. **EnviarDocumento** - Enviar factura a certificar
3. **ConsultarDocumento** - Verificar estado de factura
4. **AnularDocumento** - Anular una factura (7 días)
5. **NotaCredito** - Emitir nota de crédito
6. **NotaDebito** - Emitir nota de débito

---

**✅ Estado:** CREDENCIALES VERIFICADAS Y SISTEMA FUNCIONANDO
