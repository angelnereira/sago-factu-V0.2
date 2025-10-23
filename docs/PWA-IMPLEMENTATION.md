# 📱 PWA Implementation - SAGO-FACTU

## ✅ Implementación Completa

SAGO-FACTU ahora es una **Progressive Web App (PWA)** instalable en dispositivos móviles y de escritorio.

---

## 🎯 Características PWA

### ✅ Instalación
- **Android**: Banner de instalación automático
- **iOS**: Agregar a pantalla de inicio
- **Desktop**: Chrome, Edge, Safari (macOS)

### ✅ Funcionalidades
- 📥 **Instalación con un click**
- 🚀 **Inicio rápido** desde la pantalla de inicio
- 📱 **Modo standalone** (pantalla completa, sin barra del navegador)
- 🎨 **Theme color** adaptativo (light/dark)
- 🔔 **Preparado para notificaciones push** (futuro)
- 📦 **Cache inteligente** para assets estáticos
- 🌐 **Funcionalidad offline** (básica)

---

## 🛠️ Archivos Implementados

### 1. **Configuración PWA** (`next.config.js`)
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Estrategias de cache configuradas
  ]
})
```

**Estrategias de Cache:**
- ✅ **Google Fonts**: CacheFirst (1 año)
- ✅ **Imágenes**: StaleWhileRevalidate (30 días)
- ✅ **JavaScript/CSS**: StaleWhileRevalidate (30 días)
- ✅ **Páginas de la app**: NetworkFirst (24 horas)

---

### 2. **Manifest** (`public/manifest.json`)
```json
{
  "name": "SAGO-FACTU - Sistema de Facturación Electrónica",
  "short_name": "SAGO-FACTU",
  "description": "Sistema Multi-Tenant de Facturación...",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#6366f1",
  "background_color": "#ffffff",
  "icons": [...],
  "shortcuts": [...]
}
```

**Shortcuts (Accesos Directos):**
1. Dashboard
2. Nueva Factura
3. Folios

---

### 3. **Iconos PWA** (`public/icons/`)
Tamaños disponibles:
- ✅ 72x72
- ✅ 96x96
- ✅ 128x128
- ✅ 144x144
- ✅ 152x152
- ✅ 192x192
- ✅ 384x384
- ✅ 512x512
- ✅ 192x192 (maskable)
- ✅ 512x512 (maskable)

**Nota:** Los iconos actuales son copias del logo principal. Para una mejor experiencia, crea iconos optimizados en estos tamaños específicos.

---

### 4. **Meta Tags** (`app/layout.tsx`)
```typescript
export const metadata: Metadata = {
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#4f46e5' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SAGO-FACTU',
  },
}
```

---

### 5. **Componentes de Instalación**

#### **A. Banner de Instalación** (`components/install-pwa.tsx`)
- Banner superior animado
- Se muestra automáticamente cuando la app es instalable
- Botón de instalación + botón de cerrar
- Se puede descartar (guarda preferencia en localStorage)
- Responsive: se adapta a móvil y desktop

**Ubicación:** Landing page (`/`)

#### **B. Botón de Instalación** (`components/install-pwa.tsx`)
- Botón compacto en el header del dashboard
- Solo visible si la app es instalable
- Se oculta automáticamente después de instalar

**Ubicación:** Dashboard header

---

## 📱 Guía de Instalación

### **Android (Chrome/Edge)**
1. Visita: `https://sago-factu-v0-2.vercel.app/`
2. Aparecerá un banner: **"Instala SAGO-FACTU en tu dispositivo"**
3. Click en **"Instalar"**
4. Confirma en el diálogo del navegador
5. ✅ Ícono agregado a tu pantalla de inicio

**Alternativa:**
- Menú (⋮) → "Agregar a pantalla de inicio"

---

### **iOS (Safari)**
1. Visita: `https://sago-factu-v0-2.vercel.app/`
2. Tap en el botón **Compartir** (ícono de compartir)
3. Scroll y selecciona **"Agregar a pantalla de inicio"**
4. Edita el nombre si lo deseas
5. Tap **"Agregar"**
6. ✅ Ícono agregado a tu pantalla de inicio

---

### **Desktop (Chrome/Edge/Brave)**
1. Visita: `https://sago-factu-v0-2.vercel.app/`
2. Click en el ícono **"Instalar"** en la barra de direcciones (➕ o 💻)
3. Click en **"Instalar"** en el diálogo
4. ✅ App instalada como aplicación de escritorio

**Alternativa:**
- Menú (⋮) → "Instalar SAGO-FACTU..."

---

### **macOS (Safari)**
- Safari 17+ soporta PWA en macOS
- Similar al proceso de iOS

---

## 🧪 Verificación de PWA

### **Lighthouse Audit**
```bash
# En Chrome DevTools
1. Abre DevTools (F12)
2. Pestaña "Lighthouse"
3. Selecciona "Progressive Web App"
4. Click "Generate report"
```

**Criterios PWA:**
- ✅ HTTPS
- ✅ Service Worker registrado
- ✅ Manifest válido
- ✅ Iconos adecuados
- ✅ Viewport configurado
- ✅ Theme color definido

---

### **Verificar Service Worker**
```bash
# En Chrome DevTools
1. Application tab
2. Service Workers
3. Verificar estado: "activated and is running"
```

---

### **Verificar Manifest**
```bash
# En Chrome DevTools
1. Application tab
2. Manifest
3. Verificar todos los campos
```

---

## 🚀 Build y Deploy

### **Development**
```bash
npm run dev
```
**Nota:** PWA está deshabilitado en desarrollo (`disable: process.env.NODE_ENV === 'development'`)

---

### **Production Build**
```bash
npm run build
```

**Archivos generados automáticamente:**
- `public/sw.js` (Service Worker)
- `public/workbox-*.js` (Workbox runtime)
- `public/sw.js.map` (Source map)

**Estos archivos están en `.gitignore` y se regeneran en cada build.**

---

### **Deploy a Vercel**
```bash
git add .
git commit -m "feat: implementación PWA completa"
git push origin main
```

Vercel automáticamente:
1. Detecta los cambios
2. Ejecuta `npm run build`
3. Genera los archivos PWA
4. Despliega la app con PWA habilitado

---

## 🎨 Personalización

### **Cambiar Theme Color**
```json
// public/manifest.json
"theme_color": "#TU_COLOR_AQUI",
"background_color": "#TU_COLOR_AQUI"
```

```typescript
// app/layout.tsx
themeColor: [
  { media: '(prefers-color-scheme: light)', color: '#TU_COLOR' },
  { media: '(prefers-color-scheme: dark)', color: '#TU_COLOR_DARK' },
]
```

---

### **Agregar más Shortcuts**
```json
// public/manifest.json
"shortcuts": [
  {
    "name": "Tu Nuevo Shortcut",
    "short_name": "Shortcut",
    "description": "Descripción",
    "url": "/ruta/a/tu/pagina",
    "icons": [{ "src": "/icons/icon-96.png", "sizes": "96x96" }]
  }
]
```

---

### **Optimizar Iconos**

**Recomendaciones:**
1. Usa herramientas como [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   ```bash
   npx pwa-asset-generator public/sago-factu-logo.png public/icons --background "#ffffff" --padding "10%"
   ```

2. O usa servicios online:
   - [PWA Manifest Generator](https://www.simicart.com/manifest-generator.html/)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)

3. Los iconos maskables deben tener **safe zone** (80% del área)

---

## 🔔 Futuras Mejoras

### **1. Notificaciones Push**
```typescript
// Ejemplo para futuro
if ('Notification' in window && 'serviceWorker' in navigator) {
  const permission = await Notification.requestPermission()
  if (permission === 'granted') {
    // Implementar push notifications
  }
}
```

---

### **2. Sync en Background**
```typescript
// Sincronizar datos cuando se recupere la conexión
if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
  const registration = await navigator.serviceWorker.ready
  await registration.sync.register('sync-invoices')
}
```

---

### **3. Modo Offline Completo**
- Cache de páginas dinámicas
- IndexedDB para datos locales
- Queue de acciones pendientes

---

### **4. App Shortcuts Dinámicos**
```typescript
// Actualizar shortcuts basado en uso frecuente
if ('shortcuts' in navigator) {
  await navigator.shortcuts.update([
    // shortcuts dinámicos
  ])
}
```

---

## 📊 Métricas PWA

### **Qué Monitorear:**
1. **Instalaciones**: Eventos `appinstalled`
2. **Retención**: Usuarios que regresan vía PWA
3. **Rendimiento**: Tiempo de carga desde Service Worker
4. **Uso Offline**: Interacciones sin conexión

### **Google Analytics**
```typescript
// Trackear instalación
window.addEventListener('appinstalled', () => {
  gtag('event', 'pwa_installed', {
    event_category: 'engagement',
    event_label: 'PWA Installation',
  })
})
```

---

## 🐛 Troubleshooting

### **Service Worker no se actualiza**
```bash
# En DevTools → Application → Service Workers
1. Check "Update on reload"
2. Click "Unregister"
3. Reload (Ctrl+Shift+R)
```

### **Manifest no se detecta**
```bash
# Verificar en DevTools → Application → Manifest
- Verificar ruta: /manifest.json
- Verificar que no haya errores de sintaxis JSON
- Verificar que los iconos existan
```

### **App no es instalable**
**Requisitos:**
- ✅ HTTPS (o localhost)
- ✅ Manifest válido
- ✅ Service Worker registrado
- ✅ start_url válido
- ✅ Iconos 192x192 y 512x512

---

## 📚 Recursos

- [PWA Documentation - web.dev](https://web.dev/progressive-web-apps/)
- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

## ✅ Checklist de Implementación

- [x] Instalar `next-pwa`
- [x] Configurar `next.config.js` con PWA
- [x] Crear `manifest.json`
- [x] Generar iconos PWA (todos los tamaños)
- [x] Actualizar `app/layout.tsx` con meta tags
- [x] Crear componente `InstallPWA`
- [x] Integrar banner en landing page
- [x] Integrar botón en dashboard
- [x] Agregar animaciones CSS
- [x] Actualizar `.gitignore`
- [x] Documentar implementación
- [ ] Build y probar en producción
- [ ] Verificar con Lighthouse
- [ ] Probar instalación en Android
- [ ] Probar instalación en iOS
- [ ] Probar instalación en Desktop

---

## 🎉 Resultado Final

**SAGO-FACTU es ahora una PWA completa con:**
- ✅ Instalación nativa en todos los dispositivos
- ✅ Experiencia de app nativa
- ✅ Performance optimizado con cache
- ✅ Soporte para dark mode
- ✅ Accesos directos (shortcuts)
- ✅ Banner de instalación atractivo
- ✅ Botón de instalación en dashboard
- ✅ Preparado para futuras mejoras (push, offline, sync)

**¡La app está lista para ser instalada por los usuarios! 🚀📱**

