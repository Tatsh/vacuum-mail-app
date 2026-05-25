<!-- markdownlint-configure-file {"MD024": { "siblings_only": true } } -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Rewrote the original CoffeeScript implementation in TypeScript.
- Adopted `jxa-lib` for the `FileManager`, `getenv`, and related JXA wrappers.
- Switched the build to webpack with `ts-loader` and `webpack-shebang-plugin`.
- Added Vitest unit tests that mock `jxa-lib` and the JXA globals (`$`, `ObjC`, `Application`).

[unreleased]: https://github.com/Tatsh/vacuum-mail-app/compare/v0.0.0...HEAD
