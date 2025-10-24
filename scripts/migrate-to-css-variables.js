#!/usr/bin/env node

/**
 * Script para migrar colores hardcodeados a variables CSS
 * Reemplaza clases de Tailwind específicas por clases semánticas
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mapeo de reemplazos
const replacements = {
  // Fondos
  'bg-white': 'bg-card',
  'bg-gray-50': 'bg-muted',
  'bg-gray-100': 'bg-secondary',
  
  // Textos
  'text-gray-900': 'text-foreground',
  'text-gray-800': 'text-foreground',
  'text-gray-700': 'text-card-foreground',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-400': 'text-muted-foreground',
  
  // Bordes
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
};

// Patrones que NO deben ser reemplazados (tienen dark: variant)
const skipPatterns = [
  /dark:bg-/,
  /dark:text-/,
  /dark:border-/,
  /hover:bg-gray-/,
  /dark:hover:bg-/,
];

function shouldSkipLine(line) {
  return skipPatterns.some(pattern => pattern.test(line));
}

function migrateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let changes = 0;
    
    // Procesar línea por línea para evitar reemplazar líneas con dark:
    const lines = content.split('\n');
    const newLines = lines.map(line => {
      // Si la línea ya tiene variante dark:, no la tocamos
      if (shouldSkipLine(line)) {
        return line;
      }
      
      let newLine = line;
      for (const [oldClass, newClass] of Object.entries(replacements)) {
        // Solo reemplazar si no está seguido de "dark:"
        const regex = new RegExp(`\\b${oldClass}\\b(?!\\s+dark:)`, 'g');
        if (regex.test(newLine)) {
          newLine = newLine.replace(regex, newClass);
          changes++;
        }
      }
      return newLine;
    });
    
    if (changes > 0) {
      newContent = newLines.join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ ${filePath}: ${changes} reemplazos`);
      return changes;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error en ${filePath}:`, error.message);
    return 0;
  }
}

function findTsxFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorar node_modules, .next, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        findTsxFiles(filePath, filesList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      filesList.push(filePath);
    }
  });
  
  return filesList;
}

function main() {
  console.log('🚀 Iniciando migración a variables CSS...\n');
  
  const directories = ['app', 'components'];
  let totalChanges = 0;
  let filesChanged = 0;
  
  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📂 Procesando ${dir}/...`);
      const files = findTsxFiles(dirPath);
      
      files.forEach(file => {
        const changes = migrateFile(file);
        if (changes > 0) {
          totalChanges += changes;
          filesChanged++;
        }
      });
    }
  });
  
  console.log(`\n✨ Migración completada:`);
  console.log(`   - Archivos modificados: ${filesChanged}`);
  console.log(`   - Total de reemplazos: ${totalChanges}`);
  console.log(`\n⚠️  IMPORTANTE: Revisa los cambios con git diff antes de commitear`);
}

main();

