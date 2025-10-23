// Script de diagnóstico de tema para SAGO-FACTU
// Ejecuta esto en la consola del navegador (F12)

console.log('🔍 === DIAGNÓSTICO DE TEMA SAGO-FACTU ===\n');

// 1. Verificar HTML class
const htmlClass = document.documentElement.className;
console.log('1️⃣ Clase del <html>:', htmlClass || '(vacío - modo claro)');
console.log('   Tiene "dark"?', document.documentElement.classList.contains('dark'));

// 2. Verificar localStorage
const storedTheme = localStorage.getItem('sago-factu-theme');
console.log('\n2️⃣ Tema guardado en localStorage:', storedTheme || '(ninguno)');

// 3. Verificar que Tailwind dark mode está funcionando
const testDiv = document.createElement('div');
testDiv.className = 'text-gray-900 dark:text-gray-100';
document.body.appendChild(testDiv);
const computedColor = window.getComputedStyle(testDiv).color;
document.body.removeChild(testDiv);
console.log('\n3️⃣ Test de estilos Tailwind dark:');
console.log('   Color calculado:', computedColor);

// 4. Buscar el botón de ThemeToggle
const themeButtons = document.querySelectorAll('[aria-label*="modo"]');
console.log('\n4️⃣ Botones de tema encontrados:', themeButtons.length);
if (themeButtons.length > 0) {
  themeButtons.forEach((btn, idx) => {
    console.log(`   Botón ${idx + 1}:`, btn.getAttribute('aria-label'));
  });
} else {
  console.warn('   ⚠️ No se encontró ningún botón de tema!');
}

// 5. Función para cambiar el tema manualmente
window.toggleThemeManual = function() {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  
  if (isDark) {
    html.classList.remove('dark');
    localStorage.setItem('sago-factu-theme', 'light');
    console.log('✅ Cambiado a modo CLARO');
  } else {
    html.classList.add('dark');
    localStorage.setItem('sago-factu-theme', 'dark');
    console.log('✅ Cambiado a modo OSCURO');
  }
  
  console.log('   Nueva clase:', html.className || '(vacío)');
};

console.log('\n📝 COMANDOS DISPONIBLES:');
console.log('   toggleThemeManual()  - Cambiar tema manualmente');
console.log('   localStorage.clear() - Limpiar almacenamiento');
console.log('\n💡 Si el botón no funciona, ejecuta: toggleThemeManual()');
console.log('🔄 Luego recarga la página: location.reload()');

