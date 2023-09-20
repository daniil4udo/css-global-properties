'use strict'

module.exports = {
    extends: [
        '@democrance',
    ],
    rules: {
        // dmc
        '@typescript-eslint/semi': [ 'error', 'never' ],
    },
    overrides: [
        {
            // env: {
            //     vitest: true,
            // },
            files: [
                '**/*.spec.{j,t}s?(x)',
                '**/*.unit.{j,t}s?(x)',
                // '**/__tests__/*.{j,t}s?(x)',
                // '**/tests/unit/**/*.spec.{j,t}s?(x)',
                // '**/(*.)spec.{j,t}s?(x)',
            ],
            extends: [ 'plugin:vitest/recommended' ],
            plugins: [ 'vitest' ],
        },
    ],
}
