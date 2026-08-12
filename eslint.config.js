// @ts-check
const path = require('node:path');

const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const stylistic = require('@stylistic/eslint-plugin');
const simpleImportSort = require('eslint-plugin-simple-import-sort');

const appRoot = path.resolve(__dirname, 'src/app');

function appModule(filePath) {
  const relativePath = path.relative(appRoot, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) return null;

  const parts = relativePath.split(path.sep);
  return { layer: parts[0], feature: parts[0] === 'features' ? parts[1] : null, parts };
}

function isFeaturePublicApi(module) {
  return module.layer === 'features' && module.parts[2]?.replace(/\.ts$/, '') === 'public-api';
}

const architecture = {
  rules: {
    boundaries: {
      meta: {
        type: 'problem',
        docs: { description: 'Enforce the frontend dependency direction' },
        schema: [],
        messages: {
          coreBoundary: 'Core infrastructure cannot import from the {{target}} layer.',
          sharedBoundary: 'Shared code cannot import from the {{target}} layer.',
          shellFeatureBoundary:
            'Shell code must import feature {{feature}} through its public-api.',
          featureBoundary:
            'Feature {{source}} must import feature {{target}} through its public-api.',
          featureShellBoundary: 'Features cannot import from the shell layer.',
        },
      },
      create(context) {
        const sourceModule = appModule(context.filename);
        if (!sourceModule) return {};

        function check(node) {
          const importPath = node.source?.value;
          if (typeof importPath !== 'string' || !importPath.startsWith('.')) return;

          const targetModule = appModule(path.resolve(path.dirname(context.filename), importPath));
          if (!targetModule) return;

          if (sourceModule.layer === 'core' && targetModule.layer !== 'core') {
            context.report({
              node,
              messageId: 'coreBoundary',
              data: { target: targetModule.layer },
            });
          } else if (sourceModule.layer === 'shared' && targetModule.layer !== 'shared') {
            context.report({
              node,
              messageId: 'sharedBoundary',
              data: { target: targetModule.layer },
            });
          } else if (
            sourceModule.layer === 'shell' &&
            targetModule.layer === 'features' &&
            !isFeaturePublicApi(targetModule)
          ) {
            context.report({
              node,
              messageId: 'shellFeatureBoundary',
              data: { feature: targetModule.feature },
            });
          } else if (sourceModule.layer === 'features' && targetModule.layer === 'shell') {
            context.report({ node, messageId: 'featureShellBoundary' });
          } else if (
            sourceModule.layer === 'features' &&
            targetModule.layer === 'features' &&
            sourceModule.feature !== targetModule.feature &&
            !isFeaturePublicApi(targetModule)
          ) {
            context.report({
              node,
              messageId: 'featureBoundary',
              data: { source: sourceModule.feature, target: targetModule.feature },
            });
          }
        }

        return {
          ExportAllDeclaration: check,
          ExportNamedDeclaration: check,
          ImportDeclaration: check,
        };
      },
    },
  },
};

module.exports = defineConfig([
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'public/mockServiceWorker.js', 'App/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: {
      '@stylistic': stylistic,
      architecture,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@stylistic/lines-between-class-members': [
        'error',
        {
          enforce: [
            { blankLine: 'always', prev: 'field', next: 'method' },
            { blankLine: 'always', prev: 'method', next: 'field' },
            { blankLine: 'always', prev: 'method', next: 'method' },
          ],
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/member-ordering': [
        'error',
        { default: ['signature', 'field', 'constructor', 'method'] },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'architecture/boundaries': 'error',
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
      'sort-imports': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
    },
  },
]);
