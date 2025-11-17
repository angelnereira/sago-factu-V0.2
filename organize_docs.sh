#!/bin/bash

# Move BLUEPRINT files to docs/business/
mkdir -p docs/business
mv BLUEPRINT-FEATURES-TECNICAS.md docs/business/ 2>/dev/null
mv BLUEPRINT-MODELO-NEGOCIO.md docs/business/ 2>/dev/null
mv BLUEPRINT-RESUMEN-EJECUTIVO.md docs/business/ 2>/dev/null
mv BLUEPRINTS-INDEX.md docs/business/INDEX.md 2>/dev/null

# Move HKA-related docs to docs/integrations/
mkdir -p docs/integrations
mv THE-FACTORY-HKA-TECHNICAL-BRIEF.md docs/integrations/ 2>/dev/null
mv EMAIL-TEMPLATE-THE-FACTORY-HKA.md docs/integrations/ 2>/dev/null

# Move CONNECTIVITY and DEPLOYMENT to docs/deployment/
mkdir -p docs/deployment
mv CONNECTIVITY-AND-DEPLOYMENT-STATUS.md docs/deployment/status.md 2>/dev/null
mv VERCEL-DEPLOYMENT-GUIDE.md docs/deployment/vercel.md 2>/dev/null

# Move SECURITY to docs/architecture/
mkdir -p docs/architecture
mv SECURITY-ARCHITECTURE-ANALYSIS.md docs/architecture/security.md 2>/dev/null
mv ARQUITECTURA-CREDENCIALES-USUARIOS.md docs/architecture/credentials.md 2>/dev/null

# Move TESTING to docs/quality-assurance/
mkdir -p docs/quality-assurance
mv TESTING-PRODUCTION.md docs/quality-assurance/testing.md 2>/dev/null
mv PRODUCTION-READINESS-CHECKLIST.md docs/quality-assurance/production-checklist.md 2>/dev/null

# Move GUIDES
mkdir -p docs/guides
mv INSTRUCCIONES-LOGIN.md docs/guides/login-instructions.md 2>/dev/null
mv INSTRUCCIONES-VERIFICAR-CAMBIOS-UI.md docs/guides/ui-changes-verification.md 2>/dev/null
mv ENCRYPTION-FIX-SUMMARY.md docs/guides/encryption.md 2>/dev/null

# Move CONTRIBUTING to docs/contributing/
mkdir -p docs/contributing
mv CONTRIBUTING.md docs/contributing/ 2>/dev/null
mv README-GIT-WORKFLOW.md docs/contributing/git-workflow.md 2>/dev/null
mv .git-workflow.md docs/contributing/workflow.md 2>/dev/null

# Move legacy/implementation docs to docs/archive/
mkdir -p docs/archive
mv CREDENCIALES-HKA-VERIFICADAS.md docs/archive/ 2>/dev/null
mv CREDENCIALES-VERCEL.md docs/archive/ 2>/dev/null
mv DARK-MODE-COMPLETO.md docs/archive/ 2>/dev/null
mv DOCUMENTACION-ANALISIS.md docs/archive/ 2>/dev/null
mv DOCUMENTACION-TECNICA.md docs/archive/ 2>/dev/null
mv IMPLEMENTACION-CORRECC* docs/archive/ 2>/dev/null
mv IMPLEMENTACION-CREDENCIALES-USUARIO.md docs/archive/ 2>/dev/null
mv implementar-sistema-planes.plan.md docs/archive/ 2>/dev/null
mv implementar-sistema-planes-simple-v2.plan.md docs/archive/ 2>/dev/null
mv PLAN-IMPLEMENTACION-USUARIO-CREDENCIALES.md docs/archive/ 2>/dev/null
mv PROXIMOS-PASOS.md docs/archive/ 2>/dev/null
mv REPORTE-COMPLETO-APIs-HKA.md docs/archive/ 2>/dev/null
mv REPORTE-DETALLADO-APIs.md docs/archive/ 2>/dev/null
mv SOLUCION-TEMA.md docs/archive/ 2>/dev/null
mv VERIFICACION-APIs.md docs/archive/ 2>/dev/null
mv VERIFICACION-FEATURE-RESPUESTA.md docs/archive/ 2>/dev/null
mv VERIFICACION-LOGIN-VERCEL.md docs/archive/ 2>/dev/null

echo "✅ Documentation reorganization complete!"
