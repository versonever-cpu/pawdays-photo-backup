# Contributing

This repository is a standalone browser ZIP backup utility extracted from PawDays. Contributions to documentation, tests, validation, and portable backups are welcome.

## Local checks
- Install Node.js 20 or later.
- Run `node test.mjs` before opening a pull request.
- Keep dependencies optional and avoid introducing backend services.
- Include tests for invalid ZIP input, duplicate paths, CRC mismatches, and payload limits.
- Never commit production database keys, OAuth secrets, real user records, or identifiable photos.

## Pull requests
Explain the behavior change, its risks and the test cases. Avoid breaking existing ZIP files without a versioned migration plan. No contributor should claim security certification based on unit tests alone.
