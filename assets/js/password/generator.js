// ─── ByteSeal Password Generator ─────────────────────────────────────────────
// Generates a cryptographically random password with guaranteed strong entropy.
// Min 22 characters, always includes all 4 character classes.

const LOWER   = 'abcdefghijkmnopqrstuvwxyz';   
const UPPER   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';  
const DIGITS  = '23456789';               
const SYMBOLS = '!@#$%^&*-_=+?';
const ALL     = LOWER + UPPER + DIGITS + SYMBOLS;

function randInt(max) {
  const limit = 256 - (256 % max);
  let val;
  do {
    val = crypto.getRandomValues(new Uint8Array(1))[0];
  } while (val >= limit);
  return val % max;
}

export function generatePassword(length = 24) {
  length = Math.max(length, 22);

  const guaranteed = [
    LOWER  [randInt(LOWER.length)],
    LOWER  [randInt(LOWER.length)],
    UPPER  [randInt(UPPER.length)],
    UPPER  [randInt(UPPER.length)],
    DIGITS [randInt(DIGITS.length)],
    DIGITS [randInt(DIGITS.length)],
    SYMBOLS[randInt(SYMBOLS.length)],
    SYMBOLS[randInt(SYMBOLS.length)],
  ];

  const rest = Array.from(
    { length: length - guaranteed.length },
    () => ALL[randInt(ALL.length)]
  );
  const chars = [...guaranteed, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}