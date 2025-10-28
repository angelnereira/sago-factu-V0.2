# 🔧 Git Workflow - SAGO-FACTU

## 📋 Configuración Actual

### **Configuraciones Aplicadas**
```bash
# Push manual requerido
git config --global push.default simple
git config --global push.autoSetupRemote false
git config --global push.followTags false
```

### **¿Qué Significa Esto?**
- ✅ **No hay push automático** - Todo push requiere comando manual
- ✅ **Control total** sobre cuándo enviar cambios a GitHub
- ✅ **Prevención de accidentes** - No se envían cambios sin confirmación
- ✅ **Workflow seguro** - Puedes revisar antes de hacer push

---

## 🚀 Workflow Recomendado

### **1. Desarrollo Normal**
```bash
# Hacer cambios
git add .
git commit -m "feat: descripción del cambio"

# Revisar cambios antes de enviar
git log --oneline -5
git diff HEAD~1

# Enviar cuando estés listo
git push origin main
```

### **2. Para Cambios Importantes**
```bash
# Crear branch para cambios grandes
git checkout -b feature/nueva-funcionalidad

# Trabajar en el branch
git add .
git commit -m "feat: implementar nueva funcionalidad"

# Revisar cambios
git log --oneline
git diff main..HEAD

# Push del branch
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
# Merge cuando esté aprobado
```

### **3. Para Hotfixes**
```bash
# Cambios urgentes
git add .
git commit -m "fix: corregir error crítico"

# Revisar que el fix es correcto
git show HEAD

# Push inmediato
git push origin main
```

---

## ⚠️ Comandos que NO se Ejecutan Automáticamente

### **Estos comandos requieren confirmación manual:**
- `git push` - Enviar cambios a GitHub
- `git push --force` - Forzar push (peligroso)
- `git push --tags` - Enviar tags
- `git push --all` - Enviar todas las ramas

### **Comandos que SÍ funcionan automáticamente:**
- `git add` - Agregar archivos al staging
- `git commit` - Hacer commit local
- `git pull` - Traer cambios del remoto
- `git fetch` - Obtener información del remoto

---

## 🔍 Verificación de Estado

### **Antes de hacer push, siempre revisa:**
```bash
# Ver qué archivos cambiaron
git status

# Ver diferencias
git diff --cached

# Ver historial reciente
git log --oneline -5

# Ver qué se va a enviar
git log origin/main..HEAD
```

### **Comandos de Seguridad**
```bash
# Ver configuración actual
git config --list | grep push

# Verificar remoto
git remote -v

# Ver estado de la rama
git branch -vv
```

---

## 📝 Convenciones de Commits

### **Formato Recomendado**
```
tipo(scope): descripción breve

Descripción detallada si es necesario

Fixes #123
```

### **Tipos Válidos**
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Documentación
- `style:` - Formato, espacios
- `refactor:` - Refactorización
- `test:` - Tests
- `chore:` - Tareas de mantenimiento

### **Ejemplos**
```bash
git commit -m "feat(hka): implementar validación de RUCs"
git commit -m "fix(invoice): corregir cálculo de totales"
git commit -m "docs: actualizar README con instrucciones"
git commit -m "refactor(api): simplificar endpoints de monitoreo"
```

---

## 🛡️ Protecciones Adicionales

### **Si quieres más control, puedes agregar:**
```bash
# Prevenir push directo a main
git config --global init.defaultBranch develop

# Requerir pull antes de push
git config --global push.autoSetupRemote false

# Configurar alias útiles
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
```

---

## 🚨 En Caso de Emergencia

### **Si necesitas hacer push inmediato:**
```bash
# Para cambios críticos
git add .
git commit -m "hotfix: corrección urgente"
git push origin main
```

### **Si necesitas revertir un push:**
```bash
# Revertir último commit
git revert HEAD
git push origin main

# O resetear a commit anterior (peligroso)
git reset --hard HEAD~1
git push --force origin main
```

---

## 📊 Resumen de Configuración

| Configuración | Valor | Efecto |
|---------------|-------|--------|
| `push.default` | `simple` | Push solo a rama actual |
| `push.autoSetupRemote` | `false` | No crear ramas remotas automáticamente |
| `push.followTags` | `false` | No enviar tags automáticamente |
| `pull.rebase` | `true` | Usar rebase en pull |

**Resultado**: Control total sobre cuándo y qué se envía a GitHub. ✅
