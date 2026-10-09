const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    js.configs.recommended,
    {
        files: ['js/**/*.js', 'test/**/*.js'],
        rules: {
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1, maxBOF: 0 }]
        }
    },
    {
        files: ['js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2017,
            sourceType: 'commonjs',
            globals: {
                ...globals.browser,
                ...globals.mocha,
                ...globals.jquery,
                YT: 'readonly',
                ga: 'readonly',
                twttr: 'readonly',
                time: 'readonly',
                browser: 'readonly'
            }
        },
    },
    {
        files: ['test/**/*.js'],
        languageOptions: {
            ecmaVersion: 2017,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.mocha,
                ...globals.browser,
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                process: 'readonly',
                global: 'writable',
                window: 'readonly',
                document: 'readonly',
                YT: 'readonly',
                ga: 'readonly',
                twttr: 'readonly',
                time: 'readonly',
                browser: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'off',
            'no-undef': 'error'
        }
    },
    {
        files: ['test/playwright-config.js'],
        languageOptions: {
            ecmaVersion: 2017,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly'
            }
        },
        rules: {
            'no-undef': 'error'
        }
    }
];