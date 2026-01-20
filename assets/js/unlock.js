/*
  Cryptex v2.1 — Unlock
  (formerly FileSeal v1)

  Supported formats:
  - FileSeal v1
  - Cryptex v2.1

  Container header:
  [ 8  bytes ] magic      "CRYPTEX\0"  (Cryptex) | "FILESEAL" (legacy)
  [ 1  byte  ] version    0x02          (Cryptex v2.1 protocol)
  [ 16 bytes ] salt
  [ 12 bytes ] iv
  [ n bytes  ] AES-GCM encrypted payload

  Payload (after decrypt):
  [ 4 bytes ] metadata length (uint32, big-endian)
  [ n bytes ] metadata JSON (utf-8)
  [ m bytes ] file bytes
*/



import { FORMATS } from "./version.js";

// =====================
// Constants
// =====================
const MAGIC_LEN = 8;
const VERSION_LEN = 1;
const SALT_LEN = 16;
const IV_LEN = 12;

const HEADER_LEN = MAGIC_LEN + VERSION_LEN + SALT_LEN + IV_LEN;
const PBKDF2_ITERS = 250000;

// =====================
// DOM
// =====================
const form = document.getElementById("form");
const fileInput = document.getElementById("file");
const fileNameEl = document.getElementById("fileName");
const passwordInput = document.getElementById("password");
const status = document.getElementById("status");
const unlockBtn = document.getElementById("unlockBtn");

// =====================
// Helpers
// =====================
if (fileInput && fileNameEl) {
  fileInput.addEventListener("change", () => {
    fileNameEl.textContent =
      fileInput.files.length ? fileInput.files[0].name : "No file chosen";
  });
}

function setStatus(msg, isError = false) {
  status.textContent = msg;
  status.style.color = isError ? "#a33" : "#222";
}

function detectFormat(buf) {
  const magic = new TextDecoder().decode(buf.slice(0, MAGIC_LEN));
  for (const fmt of Object.values(FORMATS)) {
    if (magic === fmt.magic) return fmt;
  }
  throw new Error("Unknown container format");
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

// =====================
// Main
// =====================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  const file = fileInput.files[0];
  if (!file) return setStatus("No file selected", true);

  const password = passwordInput.value;
  if (!password) return setStatus("Password required", true);

  unlockBtn.disabled = true;

  try {
   setStatus("Reading container…");
   const buf = new Uint8Array(await file.arrayBuffer());
   if (buf.length < HEADER_LEN) throw new Error("Invalid container");

    setStatus("Detecting format…");
    const format = detectFormat(buf);

    const version = buf[MAGIC_LEN];

    if (version !== format.version)
      throw new Error(`Unsupported ${format.label}`);

    const saltOff = MAGIC_LEN + VERSION_LEN;
    const ivOff = saltOff + SALT_LEN;
    const ctOff = ivOff + IV_LEN;

    const salt = buf.slice(saltOff, saltOff + SALT_LEN);
    const iv = buf.slice(ivOff, ivOff + IV_LEN);
    const ct = buf.slice(ctOff);

    setStatus("Deriving key…");
    const key = await deriveKey(password, salt.buffer);


    setStatus("Decrypting…");
    const plaintext = new Uint8Array(
   await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct)
   );


    const view = new DataView(plaintext.buffer);
    const metaLen = view.getUint32(0, false);

    const metaJson = new TextDecoder().decode(
      plaintext.slice(4, 4 + metaLen)
    );
    const meta = JSON.parse(metaJson);

    const fileBytes = plaintext.slice(4 + metaLen);
    setStatus("Restoring file…");
    const blob = new Blob([fileBytes], { type: meta.type });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = meta.name;
    a.click();
    URL.revokeObjectURL(a.href);

    setStatus(`File restored (${format.label})`);
  } catch (err) {
    setStatus(err.message || String(err), true);
  } finally {
    unlockBtn.disabled = false;
  }
});

