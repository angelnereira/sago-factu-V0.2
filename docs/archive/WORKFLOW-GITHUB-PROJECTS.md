# Flujo de Trabajo con GitHub Projects (No bloqueante)

Este documento resume cómo usar GitHub Projects para planificar sin bloquear el desarrollo.

## Tableros sugeridos

1) Team planning
- Board maestro por equipo
- Campos: `owner`, `priority`, `status`, `sprint`
- Vista por ciclo (2-3 semanas) para capacidad

2) Kanban
- Columnas: Backlog → In Progress (WIP 3) → Review → Done
- WIP limits comunicados, no forzados por reglas

3) Feature release
- Vista filtrada por milestone/label `release:x.y.z`
- Checklist en el PR, sin gating automático

4) Bug tracker
- Issue template `bug.md` + labels `bug`, `severity:*`, `area:*`
- SLA opcional por severidad, seguimiento manual

5) Iterative development
- Iterations en Projects (sprints)
- Issues etiquetadas `sprint:YYYY-WW` o campo `iteration`

6) Product launch
- Vista agregada cross-team con labels `launch:*`
- Checklist en PRs relevantes

7) Roadmap
- Roadmap por quarters (Q1..Q4)
- Issues/vínculos a epics

8) Team retrospective
- Issue template `retro.md`
- Acciones con responsable/fecha, seguimiento ligero

## Buenas prácticas
- Un issue por tarea/bug/feature de valor
- PR referencia su issue: `Closes #ID` o `Refs #ID`
- Commit subjetivo pero claro: qué/por qué/impacto
- No subir artefactos/logs al repo; usar enlaces

## Automatizaciones opcionales (sin bloquear)
- Actions CI informativo (lint/tests/build con `|| true`)
- Semantic PR para formato del título, no requerido
- Proyectos con auto-move (Open → In Progress al abrir PR; Done al merge)

## Cómo empezar
1) Crea un GitHub Project y añade vistas: Kanban, Roadmap, Iterations
2) Usa las plantillas de issues (bug, feature, retro)
3) En PRs, usa el template y linkea el issue
4) Revisa el tablero semanalmente
