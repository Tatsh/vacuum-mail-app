local utils = import 'utils.libjsonnet';

{
  uses_user_defaults: true,
  project_type: 'typescript',
  keep_dist: true,
  want_man: true,
  project_name: 'vacuum-mail-app',
  version: '0.0.0',
  description: 'Utility to vacuum the Mail.app Envelope Index SQLite database.',
  keywords: ['applescript', 'jxa', 'macos', 'mail', 'sqlite', 'typescript', 'vacuum'],
  // TypeScript only
  package_json+: {
    bin: './dist/index.js',
    dependencies+: {
      'jxa-lib': utils.latestNpmPackageVersionCaret('jxa-lib'),
    },
    devDependencies+: {
      'globals': utils.latestNpmPackageVersionCaret('globals'),
      'jxa-types': utils.latestNpmPackageVersionCaret('jxa-types'),
      'ts-loader': utils.latestNpmPackageVersionCaret('ts-loader'),
      'webpack-cli': utils.latestNpmPackageVersionCaret('webpack-cli'),
      'webpack-shebang-plugin': utils.latestNpmPackageVersionCaret('webpack-shebang-plugin'),
      webpack: utils.latestNpmPackageVersionCaret('webpack'),
    },
    files+: ['dist/index.js', 'dist/index.js.map'],
    main: 'dist/index.js',
  },
  eslint+: [{ rules: { '@typescript-eslint/no-unused-expressions': 'off' } }],
  github+: {
    workflows+: {
      publish_npm_any+: {
        build_command: 'yarn webpack',
      },
      release_gate_workflows: ['Upload dist'],
    },
  },
  tsconfig+: {
    compilerOptions+: {
      module: 'commonjs',
      emitDecoratorMetadata: true,
      lib: ['es2018'],
      newLine: 'LF',
      noEmitOnError: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      outDir: './dist/',
      strict: true,
      strictBindCallApply: true,
      strictFunctionTypes: false,
      strictNullChecks: true,
      strictPropertyInitialization: true,
      target: 'es2018',
      types: ['jxa-types', 'node'],
    },
    exclude: ['src/**/*.test.ts'],
    include: ['src'],
  },
}
