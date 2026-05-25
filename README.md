# vacuum-mail-app

<!-- WISWA-GENERATED-README:START -->

[![NPM Version](https://img.shields.io/npm/v/vacuum-mail-app)](https://www.npmjs.com/package/vacuum-mail-app)
[![NPM Downloads](https://img.shields.io/npm/dm/vacuum-mail-app)](https://www.npmjs.com/package/vacuum-mail-app)
[![GitHub tag (with filter)](https://img.shields.io/github/v/tag/Tatsh/vacuum-mail-app)](https://github.com/Tatsh/vacuum-mail-app/tags)
[![License](https://img.shields.io/github/license/Tatsh/vacuum-mail-app)](https://github.com/Tatsh/vacuum-mail-app/blob/master/LICENSE.txt)
[![GitHub commits since latest release (by SemVer including pre-releases)](https://img.shields.io/github/commits-since/Tatsh/vacuum-mail-app/v0.0.0/master)](https://github.com/Tatsh/vacuum-mail-app/compare/v0.0.0...master)
[![CodeQL](https://github.com/Tatsh/vacuum-mail-app/actions/workflows/codeql.yml/badge.svg)](https://github.com/Tatsh/vacuum-mail-app/actions/workflows/codeql.yml)
[![QA](https://github.com/Tatsh/vacuum-mail-app/actions/workflows/qa.yml/badge.svg)](https://github.com/Tatsh/vacuum-mail-app/actions/workflows/qa.yml)
[![Tests](https://github.com/Tatsh/vacuum-mail-app/actions/workflows/tests.yml/badge.svg)](https://github.com/Tatsh/vacuum-mail-app/actions/workflows/tests.yml)
[![Coverage Status](https://coveralls.io/repos/github/Tatsh/vacuum-mail-app/badge.svg?branch=master)](https://coveralls.io/github/Tatsh/vacuum-mail-app?branch=master)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-blue?logo=dependabot)](https://github.com/dependabot)
[![Stargazers](https://img.shields.io/github/stars/Tatsh/vacuum-mail-app?logo=github&style=flat)](https://github.com/Tatsh/vacuum-mail-app/stargazers)
[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit)](https://github.com/pre-commit/pre-commit)
[![Prettier](https://img.shields.io/badge/Prettier-black?logo=prettier)](https://prettier.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-black?logo=typescript)](https://www.typescriptlang.org/)
[![Yarn](https://img.shields.io/badge/Yarn-4c335c?logo=yarn)](https://yarnpkg.com/)
[![eslint](https://img.shields.io/badge/eslint-black?logo=eslint)](https://www.npmjs.com/package/eslint)
[![vitest](https://img.shields.io/badge/vitest-black?logo=vitest)](https://www.npmjs.com/package/vitest)

[![@Tatsh](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fpublic.api.bsky.app%2Fxrpc%2Fapp.bsky.actor.getProfile%2F%3Factor=did%3Aplc%3Auq42idtvuccnmtl57nsucz72&query=%24.followersCount&label=Follow+%40Tatsh&logo=bluesky&style=social)](https://bsky.app/profile/Tatsh.bsky.social)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Tatsh-black?logo=buymeacoffee)](https://buymeacoffee.com/Tatsh)
[![Libera.Chat](https://img.shields.io/badge/Libera.Chat-Tatsh-black?logo=liberadotchat)](irc://irc.libera.chat/Tatsh)
[![Mastodon Follow](https://img.shields.io/mastodon/follow/109370961877277568?domain=hostux.social&style=social)](https://hostux.social/@Tatsh)
[![Patreon](https://img.shields.io/badge/Patreon-Tatsh2-F96854?logo=patreon)](https://www.patreon.com/Tatsh2)

<!-- WISWA-GENERATED-README:STOP -->

Vacuum (compact) the Mail.app `Envelope Index` SQLite database to reclaim disk space.

## Installation

Install globally and then run `vacuum-mail-app`.

```shell
yarn global add vacuum-mail-app
# or
npm install --global vacuum-mail-app
```

## Usage

```shell
vacuum-mail-app
```

If Mail is running, the script asks it to quit without saving. It then searches
`~/Library/Mail/V*/MailData/` for an `Envelope Index` SQLite file, picking the newest data-store
version present (so the same binary works on every macOS release that ships a `V<n>` folder). It
runs `sqlite3 <path> vacuum` against that file, prints the before/after byte counts and the
percentage change, and finally reopens Mail.

### Exit status

| Code | Meaning                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------ |
| 0    | The database was vacuumed successfully.                                                          |
| 1    | Vacuum failed because the Envelope Index file could not be located or `sqlite3` exited non-zero. |

## Development

```shell
yarn               # install dependencies.
yarn test          # run vitest with coverage.
yarn webpack       # bundle src/index.ts to dist/index.js.
yarn qa            # lint, spell-check, and prettier check.
```

The CLI is written in TypeScript and bundled with webpack. The runtime relies on
[`jxa-lib`](https://www.npmjs.com/package/jxa-lib) for Foundation wrappers and on
[`jxa-types`](https://www.npmjs.com/package/jxa-types) for JXA global type definitions.
