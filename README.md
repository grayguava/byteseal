## What ByteSeal is for

ByteSeal exists to do one thing:

> **Encrypt a file with a password and produce a single encrypted container.**

typical uses:

- encrypting files before storing them in untrusted locations
- moving files between devices without exposing contents
- maintaining a simple, offline encryption workflow
- experimenting with client-side cryptography in the browser

ByteSeal is not an ecosystem.  
It is a single-purpose encryption tool.

---

## What ByteSeal can do

- encrypt any file into a single encrypted container (`.byts`)
- decrypt `.byts` containers back to the original file
- preserve original filename and MIME type inside encrypted metadata
- operate fully offline after the page has loaded

---

## What ByteSeal does **not** do

- no password recovery
- no cloud storage
- no key management system
- no multi-file archives
- no defense against a compromised system

if the password is lost, the data is permanently unrecoverable.

---

## Technical overview

- **Key derivation:** PBKDF2 (SHA-256, 250,000 iterations)
- **Encryption:** AES-256-GCM (authenticated encryption)
- **Randomness:** `crypto.getRandomValues`
- **Environment:** Browser (Web Crypto API)
- **Execution model:** Client-side only

The PBKDF2 iteration count introduces a measurable delay during key derivation on typical hardware to increase resistance against offline guessing.

AES-GCM provides both confidentiality and integrity.  
modified containers or incorrect passwords will fail authentication and will not produce partial output.

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

all metadata is encrypted.

the container format is self-describing and validated by magic bytes and version before decryption.

#### Specification

The full binary container specification is available at:

[`docs/spec-v1.md`](/docs/spec-v1.md)

This document defines exact byte layout, key derivation parameters, and decryption behavior.

---

## Filenames and metadata

- output container filenames are randomly generated
- original filename and MIME type are stored inside encrypted metadata
- filenames are restored only after successful authentication

encrypted containers do not reveal the original filename.

---

## Threat model

ByteSeal is designed to protect against:

- unauthorized inspection of stored files
- cloud storage providers
- curious servers
- interception of encrypted files

Security assumes:

- the attacker has access to the encrypted container
- the attacker can perform unlimited offline password guessing attempts
- the execution environment (browser and OS) is trusted

ByteSeal does **not** protect against:

- malware on the user’s device
- keyloggers
- compromised browsers or operating systems
- weak or reused passwords

security strength depends entirely on password entropy.

---

## Limitations

- files are processed fully in memory (browser limits apply)
- very large files may fail on low-memory devices
- performance depends on device capability
- no streaming encryption (entire file buffered)

---

## Design principles

ByteSeal is intentionally:

- small
- explicit
- offline-first
- scope-limited
- minimal in dependency surface

it avoids feature creep, background services, and hidden behavior.

---

## License

MIT