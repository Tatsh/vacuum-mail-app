# vacuum-mail-app

[![NPM Version](https://img.shields.io/npm/v/vacuum-mail-app)](https://www.npmjs.com/package/vacuum-mail-app)
[![GitHub tag (with filter)](https://img.shields.io/github/v/tag/Tatsh/vacuum-mail-app)](https://github.com/Tatsh/vacuum-mail-app/tags)
[![License](https://img.shields.io/github/license/Tatsh/vacuum-mail-app)](https://github.com/Tatsh/vacuum-mail-app/blob/master/LICENSE.txt)
[![QA](https://github.com/Tatsh/vacuum-mail-app/actions/workflows/qa.yml/badge.svg)](https://github.com/Tatsh/vacuum-mail-app/actions/workflows/qa.yml)
[![Tests](https://github.com/Tatsh/vacuum-mail-app/actions/workflows/tests.yml/badge.svg)](https://github.com/Tatsh/vacuum-mail-app/actions/workflows/tests.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-black?logo=typescript)](https://www.typescriptlang.org/)
[![Yarn](https://img.shields.io/badge/Yarn-4c335c?logo=yarn)](https://yarnpkg.com/)

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

The script quits Mail if it is running, runs `sqlite3 <path> vacuum` against the Envelope Index
database under `~/Library/Mail/<version>/MailData/`, prints the before/after byte counts and the
percentage change, and then reopens Mail.

### Exit status

| Code | Meaning                                                |
| ---- | ------------------------------------------------------ |
| 0    | The database was vacuumed successfully.                |
| 1    | Vacuum failed (for example, `sw_vers` or `sqlite3`).   |
