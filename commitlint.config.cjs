module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-case': [2, 'always', 'sentence-case'],
    'type-enum': [
      2,
      'always',
      [
        'feat','fix','refactor','chore','docs','test','perf','ci','build','style','revert'
      ]
    ]
  }
}


