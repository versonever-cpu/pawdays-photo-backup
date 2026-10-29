# PawDays Photo Backup ZIP

A browser-side, dependency-free helper for writing and strictly reading **uncompressed ZIP archives** containing a `records.json` file and optional `photos/<id>.jpg|png|webp` files. Based on the PawDays browser backup helper and prepared for use as a standalone, reusable component.

**Project maturity:** Early-stage public open-source project; no stable release, external adoption claims, or independent security audit. Do not treat archive validation as a substitute for encrypted storage, user data backups or server-side authorization.

## Features / constraints

- Browser global `window.PawDaysBackup`: `zip(entries)`, `readZip(bytes)`, and `download(blob, filename)`.
- Writes UTF-8 file names in non-compressed ZIP format (STORE).
- Reader requires `records.json`; only also permits `photos/[A-Za-z0-9-]{1,128}.(jpg|png|webp)`.
- Reader checks archive framing, duplicate names, entry size, CRC-32, and traversal paths, and rejects compression/encryption.
- Reader limits include 60 MiB maximum archive and 52 MiB maximum decompressed contents. These checks do not replace a complete security audit.
- No Supabase URL, API credential, Google OAuth configuration, real customer data, or production assets are included in this extracted candidate.

## Browser example

```html
<script src="backup.js"></script>
<button id="save">Save example ZIP</button>
<script>
  document.querySelector('#save').addEventListener('click', () => {
    const records = new TextEncoder().encode(JSON.stringify({pets: []}));
    const blob = window.PawDaysBackup.zip([{name: 'records.json', data: records}]);
    window.PawDaysBackup.download(blob, 'sample-backup.zip');
  });
</script>
```

## Testing (Node.js 20+)

```sh
npm test
```

## Contributing, security and license

- [Contributing guide](CONTRIBUTING.md)
- [Security reporting](SECURITY.md)
- [MIT License](LICENSE)

This standalone repository is separate from the private PawDays application; it contains no private app Git history, production secrets or real pet records. This project has not yet established community adoption; any application for open-source maintainer support must describe its current usage and maturity truthfully.
