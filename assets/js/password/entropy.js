// ─── ByteSeal Entropy Module ──────────────────────────────────────────────────
// Uses zxcvbn (window.zxcvbn) as the base scorer, then applies a hardened
// ruleset on top to prevent inflated scores on short / low-diversity passwords.
//
// Export contract:
//   analyze(password: string) → { score, segs, label, bits, tip }
//   METER_HTML: string

const HAS_LOWER   = pw => /[a-z]/.test(pw);
const HAS_UPPER   = pw => /[A-Z]/.test(pw);
const HAS_DIGIT   = pw => /[0-9]/.test(pw);
const HAS_SYMBOL  = pw => /[^a-zA-Z0-9]/.test(pw);

function classCount(pw) {
  return [HAS_LOWER, HAS_UPPER, HAS_DIGIT, HAS_SYMBOL]
    .filter(fn => fn(pw)).length;
}

function allFourClasses(pw) {
  return classCount(pw) === 4;
}
const KEYBOARD_WALKS = [
  'qwerty','qwert','werty','asdfg','asdf','zxcvb','zxcv',
  'abcde','abcd','12345','23456','34567','98765','11111',
  'aaaaa','00000','password','letmein','iloveyou',
];

function hasKeyboardWalk(pw) {
  const lower = pw.toLowerCase();
  return KEYBOARD_WALKS.some(w => lower.includes(w));
}

function hasRepeats(pw) {
  return /(.)\1{2,}/.test(pw);
}

const CEILING = [
  { partial: 1, full: 2  },
  { partial: 2, full: 3  },
  { partial: 4, full: 5  }, 
  { partial: 6, full: 8  },  
  { partial: 7, full: 10 },
];

const SEG_LABEL = [
  '',        
  'Very Weak',  
  'Very Weak',  
  'Weak',  
  'Weak',      
  'Fair',  
  'Fair',   
  'Good',     
  'Strong', 
  'Strong',     
  'Excellent', 
];

function buildTip(pw, rawScore, cappedSegs, zxcvbnResult) {

  if (pw.length < 12) return '↑ Minimum 12 characters required';
  if (!HAS_UPPER(pw))  return '↑ Add uppercase letters';
  if (!HAS_DIGIT(pw))  return '↑ Add numbers';
  if (!HAS_SYMBOL(pw)) return '↑ Add symbols like !@#$%';
  if (hasKeyboardWalk(pw)) return '↑ Avoid keyboard patterns like "qwerty" or "1234"';
  if (hasRepeats(pw))      return '↑ Avoid repeated characters';

  const { warning, suggestions } = zxcvbnResult.feedback;
  if (warning)            return `↑ ${warning}`;
  if (suggestions.length) return `↑ ${suggestions[0]}`;

  return '';
}

export function analyze(pw) {
  const result   = window.zxcvbn(pw);
  const rawScore = result.score;                         // 0–4
  const ceil     = CEILING[rawScore];
  const hasAll4  = allFourClasses(pw);

  let segs = hasAll4 ? ceil.full : ceil.partial;
  if (hasKeyboardWalk(pw)) segs = Math.max(1, segs - 1);
  if (hasRepeats(pw))      segs = Math.max(1, segs - 1);

  const bits = Math.round(result.guesses_log10 * Math.log2(10));
  const tip  = buildTip(pw, rawScore, segs, result);

  return {
    score: rawScore,
    segs,
    label: SEG_LABEL[segs],
    bits,
    tip,
  };
}

export const METER_HTML = `
  <div class="entropy-wrap" id="entropyWrap">
    <div class="entropy-bar" id="entropyBar">
      ${Array.from({ length: 10 }, (_, i) =>
        `<div class="entropy-seg" data-seg="${i + 1}"></div>`
      ).join('')}
    </div>
    <div class="entropy-meta">
      <span class="entropy-label" id="entropyLabel">—</span>
      <span class="entropy-bits" id="entropyBits"></span>
    </div>
    <div class="entropy-tip" id="entropyTip"></div>
  </div>`;