// version.js
// Protocol registry — DO NOT break contracts casually

export const FORMATS = {
  FILESEAL_V1: {
    id: "fileseal-v1",
    magic: "FILESEAL",      // 8 bytes
    magicLen: 8,
    version: 1,
    label: "FileSeal v1",
  },

  CRYPTEX_V2_1: {
    id: "cryptex-v2.1",
    magic: "CRYPTEX\u0000", // 8 bytes (null-padded)
    magicLen: 8,
    version: 2,             // protocol version byte
    label: "Cryptex v2.1",
  },
};

// Encrypt ONLY using the newest format
export const ACTIVE_FORMAT = FORMATS.CRYPTEX_V2_1;
