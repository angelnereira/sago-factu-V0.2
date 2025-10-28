#!/bin/bash

# 🔧 Git Helper Script - SAGO-FACTU
# Script para facilitar el workflow de Git con control manual

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🔧 Git Helper - SAGO-FACTU${NC}"
    echo ""
    echo "Uso: ./git-helper.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  status     - Ver estado actual del repositorio"
    echo "  review     - Revisar cambios antes de commit"
    echo "  commit     - Hacer commit con mensaje"
    echo "  push       - Enviar cambios a GitHub (CONFIRMACIÓN REQUERIDA)"
    echo "  safe-push  - Push seguro con verificaciones"
    echo "  log        - Ver historial reciente"
    echo "  diff       - Ver diferencias"
    echo "  help       - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./git-helper.sh status"
    echo "  ./git-helper.sh commit 'feat: nueva funcionalidad'"
    echo "  ./git-helper.sh safe-push"
}

# Función para mostrar estado
show_status() {
    echo -e "${BLUE}📊 Estado del Repositorio${NC}"
    echo "=================================="
    
    # Estado general
    git status --short
    
    echo ""
    echo -e "${YELLOW}📈 Estadísticas:${NC}"
    echo "Commits locales no enviados: $(git log origin/main..HEAD --oneline | wc -l)"
    echo "Archivos modificados: $(git diff --name-only | wc -l)"
    echo "Archivos en staging: $(git diff --cached --name-only | wc -l)"
    
    echo ""
    echo -e "${YELLOW}🌿 Rama actual:${NC}"
    git branch --show-current
    
    echo ""
    echo -e "${YELLOW}🔗 Remoto:${NC}"
    git remote -v
}

# Función para revisar cambios
review_changes() {
    echo -e "${BLUE}🔍 Revisión de Cambios${NC}"
    echo "========================"
    
    if [ -n "$(git diff --cached --name-only)" ]; then
        echo -e "${GREEN}📝 Archivos en staging:${NC}"
        git diff --cached --name-only
        echo ""
        echo -e "${YELLOW}📋 Diferencias en staging:${NC}"
        git diff --cached
    else
        echo -e "${YELLOW}⚠️ No hay archivos en staging${NC}"
    fi
    
    if [ -n "$(git diff --name-only)" ]; then
        echo ""
        echo -e "${RED}📝 Archivos modificados (no en staging):${NC}"
        git diff --name-only
    fi
}

# Función para hacer commit
make_commit() {
    local message="$1"
    
    if [ -z "$message" ]; then
        echo -e "${RED}❌ Error: Debes proporcionar un mensaje de commit${NC}"
        echo "Uso: ./git-helper.sh commit 'mensaje'"
        exit 1
    fi
    
    echo -e "${BLUE}💾 Haciendo Commit${NC}"
    echo "=================="
    
    # Verificar que hay cambios
    if [ -z "$(git diff --cached --name-only)" ]; then
        echo -e "${YELLOW}⚠️ No hay archivos en staging${NC}"
        echo "Agregando todos los archivos modificados..."
        git add .
    fi
    
    # Mostrar qué se va a commitear
    echo -e "${GREEN}📝 Archivos a commitear:${NC}"
    git diff --cached --name-only
    
    echo ""
    echo -e "${GREEN}✅ Commit realizado:${NC}"
    git commit -m "$message"
    
    echo ""
    echo -e "${YELLOW}📊 Estado después del commit:${NC}"
    git status --short
}

# Función para push seguro
safe_push() {
    echo -e "${BLUE}🚀 Push Seguro${NC}"
    echo "=============="
    
    # Verificar que estamos en main
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        echo -e "${YELLOW}⚠️ Estás en la rama '$current_branch', no en 'main'${NC}"
        read -p "¿Continuar con el push? (y/N): " confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ Push cancelado${NC}"
            exit 1
        fi
    fi
    
    # Verificar que hay commits para enviar
    commits_ahead=$(git log origin/main..HEAD --oneline | wc -l)
    if [ "$commits_ahead" -eq 0 ]; then
        echo -e "${YELLOW}⚠️ No hay commits nuevos para enviar${NC}"
        exit 0
    fi
    
    # Mostrar commits que se van a enviar
    echo -e "${GREEN}📝 Commits que se van a enviar ($commits_ahead):${NC}"
    git log origin/main..HEAD --oneline
    
    echo ""
    echo -e "${RED}⚠️ CONFIRMACIÓN REQUERIDA${NC}"
    echo "Se van a enviar $commits_ahead commit(s) a GitHub"
    read -p "¿Estás seguro de continuar? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}🚀 Enviando cambios...${NC}"
        git push origin "$current_branch"
        echo -e "${GREEN}✅ Push completado exitosamente${NC}"
    else
        echo -e "${RED}❌ Push cancelado${NC}"
        exit 1
    fi
}

# Función para push directo (con advertencia)
direct_push() {
    echo -e "${RED}⚠️ PUSH DIRECTO - USAR CON PRECAUCIÓN${NC}"
    echo "======================================"
    
    current_branch=$(git branch --show-current)
    commits_ahead=$(git log origin/main..HEAD --oneline | wc -l)
    
    if [ "$commits_ahead" -eq 0 ]; then
        echo -e "${YELLOW}⚠️ No hay commits nuevos para enviar${NC}"
        exit 0
    fi
    
    echo -e "${GREEN}📝 Commits que se van a enviar ($commits_ahead):${NC}"
    git log origin/main..HEAD --oneline
    
    echo ""
    echo -e "${RED}🚨 ADVERTENCIA: Esto enviará cambios directamente a GitHub${NC}"
    read -p "¿Estás completamente seguro? Escribe 'CONFIRMAR' para continuar: " confirm
    
    if [ "$confirm" = "CONFIRMAR" ]; then
        echo -e "${GREEN}🚀 Enviando cambios...${NC}"
        git push origin "$current_branch"
        echo -e "${GREEN}✅ Push completado${NC}"
    else
        echo -e "${RED}❌ Push cancelado${NC}"
        exit 1
    fi
}

# Función para mostrar log
show_log() {
    echo -e "${BLUE}📜 Historial Reciente${NC}"
    echo "===================="
    git log --oneline -10 --graph --decorate
}

# Función para mostrar diff
show_diff() {
    echo -e "${BLUE}🔍 Diferencias${NC}"
    echo "=============="
    
    if [ -n "$(git diff --cached --name-only)" ]; then
        echo -e "${GREEN}📝 Cambios en staging:${NC}"
        git diff --cached
    fi
    
    if [ -n "$(git diff --name-only)" ]; then
        echo ""
        echo -e "${RED}📝 Cambios no en staging:${NC}"
        git diff
    fi
}

# Función principal
main() {
    case "${1:-help}" in
        "status")
            show_status
            ;;
        "review")
            review_changes
            ;;
        "commit")
            make_commit "$2"
            ;;
        "push")
            direct_push
            ;;
        "safe-push")
            safe_push
            ;;
        "log")
            show_log
            ;;
        "diff")
            show_diff
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Ejecutar función principal
main "$@"
