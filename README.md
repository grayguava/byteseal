# ByteSeal

Offline file encryption that runs entirely in your browser.

No uploads.  
No backend.  
No accounts.  
No tracking.  

Just a file → a password → an encrypted container.

---

### Live demo

https://byteseal.pages.dev

---

## Screenshot

![ByteSeal UI - Encrypt view](/docs/img/ss-encrypt.png)
Password generator and entropy estimation are built directly into the UI.
![ByteSeal UI - Decrypt view](/docs/img/ss-decrypt.png)

---

## Features

- Encrypt any file into a single `.byts` container
- AES-256-GCM authenticated encryption
- PBKDF2 key derivation (250,000 iterations)
- Built-in password generator
- Password strength + estimated entropy feedback
- Self-hosted zxcvbn model (no external requests)
- Fully offline operation after page load

---

## What ByteSeal does

ByteSeal encrypts any file into a single encrypted container (`.byts`)
using password-based encryption.

It is designed for:

- Encrypting files before storing in untrusted locations
- Moving files between devices safely
- Maintaining a simple offline encryption workflow
- Experimenting with client-side cryptography

It is intentionally small and scope-limited.

---

## How it works

1. Drop or select a file
2. Generate or enter a strong password
3. Review the strength / entropy feedback
4. Download the encrypted `.byts` container

Decryption reverses the process and restores the original file.

All encryption happens locally in your browser using the Web Crypto API.

After the page loads, ByteSeal makes **zero network requests**.

---

## Security model

### Protects against

- Unauthorized inspection of stored files
- Cloud storage providers
- Curious servers
- Intercepted encrypted containers
- Offline brute-force attempts (limited by password strength)

### Assumes

- The execution environment (browser + OS) is trusted
- The password has sufficient entropy

### Does NOT protect against

- Malware on your device
- Keyloggers
- Compromised browsers
- Weak or reused passwords
- Lost passwords (no recovery possible)

If the password is lost, the data is permanently unrecoverable.

---

## Technical overview

- **Key Derivation:** PBKDF2 (SHA-256, 250,000 iterations)
- **Encryption:** AES-256-GCM (authenticated encryption)
- **Randomness:** `crypto.getRandomValues`
- **Execution Model:** 100% client-side
- **Dependencies:** None (uses Web Crypto API)

The PBKDF2 iteration count intentionally introduces delay to increase
resistance against offline guessing.

AES-GCM ensures both confidentiality and integrity.
Incorrect passwords or modified containers fail authentication.

---

## Password strength feedback

ByteSeal includes a built-in password generator and password strength
estimation to help users choose stronger passwords.

Strength feedback and estimated entropy are calculated locally using a
bundled copy of zxcvbn.

This model runs entirely in the browser and does not require any
external scripts, APIs, or network requests.

---

## Container format (ByteSeal v1)

```
[ Plain header ]

- magic: "BYTESEAL" (8 bytes)
- version: 0x01
- salt: 16 bytes
- iv: 12 bytes

[ Encrypted payload (AES-256-GCM) ]

- metadata length (uint32, big-endian)
- metadata JSON (filename, MIME type)
- raw file bytes
```


All metadata is encrypted.

The format is self-describing and validated before decryption.

Full specification:

[`docs/spec-v1.md`](/docs/spec-v1.md)

---

## Design principles

ByteSeal is intentionally:

- Offline-first
- Minimal
- Explicit
- Small attack surface
- Free of feature creep

It is not a platform.  
It is a single-purpose encryption tool.

---

## Limitations

- Entire file processed in memory (browser limits apply)
- Very large files may fail on low-memory devices
- No streaming encryption
- No multi-file archive support
- No key management system

---

## Why browser-based?

- No installation required
- Easy verification of source
- Works across platforms
- Low friction for non-technical users

---

## Development philosophy

ByteSeal prioritizes:

- Transparency over convenience
- Explicit cryptographic boundaries
- Versioned container formats
- Clear threat modeling

---

## If you find this useful

Consider giving the repo a star ⭐

It helps others discover the project.

---

## License

MIT