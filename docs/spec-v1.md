# ByteSeal Container Specification

## Version 1 (ByteSeal v1)

---

## 1. Overview

A ByteSeal v1 container consists of:

```
+----------------------+----------------------+  
| Plaintext header     | Encrypted payload    |  
+----------------------+----------------------+
```

- header is fixed-size (37 bytes)
- payload is encrypted using AES-256-GCM
- metadata and file contents are encrypted and authenticated

all integers are big-endian unless specified otherwise.

---

## 2. Header layout (37 bytes)

|Offset|Size|Field|Description|
|---|---|---|---|
|0|8|magic|ASCII `"BYTESEAL"`|
|8|1|version|`0x01`|
|9|16|salt|Random PBKDF2 salt|
|25|12|iv|Random AES-GCM IV|
|37|—|ct|Ciphertext (incl. GCM tag)|

### Header structure (byte view)

```
[ 8 bytes ]  magic      "BYTESEAL"
[ 1 byte  ]  version    0x01
[16 bytes ]  salt
[12 bytes ]  iv
```

total header length: **37 bytes**

---

## 3. Key derivation

```
KDF: PBKDF2 (HMAC-SHA-256)  
Iterations: 250,000  
Salt: 16 bytes (from header)  
Output: 256-bit key  
Password encoding: UTF-8
```

derived key is used for AES-256-GCM.

---

## 4. Encryption

```
Cipher: AES-256-GCM
Key: Derived via PBKDF2
IV: 12 bytes (from header)
AAD: none
Auth tag: 16 bytes (appended to ciphertext)
```

AES-GCM provides:

- confidentiality
- integrity
- authentication

any modification to ciphertext, salt, IV, or authentication tag causes decryption failure.

---

## 5. Encrypted payload structure

After decryption, the payload is:

```
+----------------------+----------------------+------------------+  
| metadata_len (4B)    | metadata_json (nB)   | file_bytes (mB)  |  
+----------------------+----------------------+------------------+
```

### 5.1 Metadata length

- size: 4 bytes  
- type: uint32  
- endian: big-endian

defines the length of metadata JSON in bytes.

---

### 5.2 Metadata JSON

UTF-8 encoded JSON:

```JSON
{  
  "name": "<original filename>",  
  "type": "<MIME type>"  
}
```
---

### 5.3 File bytes

Raw byte content of the original file.

---

## 6. Decryption procedure

1. ensure file length ≥ 37 bytes.
2. read magic (offset 0–7).
    - must equal `"BYTESEAL"`.
3. read version (offset 8).
    - must equal `0x01`.
4. extract salt (offset 9–24).
5. extract IV (offset 25–36).
6. extract ciphertext (offset 37–end).
7. derive key using PBKDF2.
8. attempt AES-GCM decryption.
    - on authentication failure → reject.
9. parse metadata length.
10. extract metadata JSON.
11. extract file bytes.

if any step fails, container must be rejected.

---

## 7. Security properties

Provides:

- confidentiality of file contents
- confidentiality of metadata
- integrity and authentication of encrypted payload

Threat assumptions:

- attacker may obtain full container
- attacker may perform unlimited offline guessing
- axecution environment is trusted

security strength depends entirely on password entropy.

---

## 8. Known limitations

- PBKDF2 is CPU-hard, not memory-hard
- Entire file is buffered in memory
- Header is not bound as AES-GCM AAD
- No forward secrecy
- No streaming encryption

---

## 9. Versioning

version (1 byte) at offset 8 defines format version

Future versions must use a new version value.

Backward compatibility is not guaranteed unless explicitly defined.