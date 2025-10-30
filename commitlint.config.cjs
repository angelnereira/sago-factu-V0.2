module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-case': [2, 'always', 'kebab-case'],
    // Desactivado para permitir tu estilo natural en español
    'subject-case': [0],
    'type-enum': [
      2,
      'always',
      [
        'feat','fix','refactor','chore','docs','test','perf','ci','build','style','revert'
      ]
    ]
  }
}


