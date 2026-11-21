<!-- markdownlint-configure-file {"MD024": { "siblings_only": true } } -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.1/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.2] - 2026-11-20

### Fixed

- Publish the webpack bundle as `dist/index.js`. 0.0.1 shipped raw TypeScript compiler output that
  `osascript` could not run (`ReferenceError: Can't find variable: exports`).
- Set the version in the man page, which still said 0.0.0.

## [0.0.1] - 2026-05-25

### Changed

- Rewrote the original CoffeeScript implementation in TypeScript.
- Adopted `jxa-lib` for the `FileManager`, `getenv`, and related JXA wrappers.
- Switched the build to webpack with `ts-loader` and `webpack-shebang-plugin`.
- Added Vitest unit tests that mock `jxa-lib` and the JXA globals (`$`, `ObjC`, `Application`).

[unreleased]: https://github.com/Tatsh/vacuum-mail-app/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/Tatsh/vacuum-mail-app/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/Tatsh/vacuum-mail-app/compare/v0.0.0...v0.0.1
