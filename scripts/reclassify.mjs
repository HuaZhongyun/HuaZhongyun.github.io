// Refine each paper's `category` field into a fine-grained topic key, derived
// from its title. First matching rule wins; unmatched papers fall back to a
// per-coarse-category bucket so nothing is lost. Re-run after editing rules.
import fs from 'node:fs';
import path from 'node:path';

const BIB = path.join(process.cwd(), 'src', 'data', 'publications.bib');

// [fineKey, /title regex/]  — ORDER MATTERS (specific → general).
const RULES = [
  ['backdoor', /backdoor|trigger|后门/i],
  ['deepfake', /deepfake|synthesized speech|speech deepfake|ai-synthesized speech|spoof/i],
  ['forensics', /forgery|splicing|copy-move|manipulation chain|recolored|inpainting|tamper|归因/i],
  ['watermark', /watermark|copyright|screen-shooting|fingerprint/i],
  ['face-privacy', /face privac|privacy-preserving face|identity hider|\bveil|seeing is not believing|身份/i],
  ['adversarial', /adversarial(?!\s+(?:net|nets|networks))|perturbation|robustness distillation|re-identification|point cloud attack|robust person/i],
  ['image-encryption', /image encrypt|image cipher|object encryption|encryption through|\bs-box\b|image content-based encryption|secure image encryption|图像加密/i],
  ['compressive-sensing', /compressive sensing|compressed sensing/i],
  ['rdh', /reversible data hiding|data hiding|reversible image degradation/i],
  ['mvlearning', /multi-view|subspace clustering|spectral clustering|contrastive learning|graph contrastive|low-rank tensor|trajectory forecasting|graph representation learning|知识图谱/i],
  ['dedup-audit', /deduplication|dedup|auditing/i],
  ['encrypted-query', /skyline|top-k|set computation|keyword search|attribute-based encryption|query processing|oblivious/i],
  ['ppml', /federated learning|differential privacy|free-rider|matrix factorization|gradient boosted|glove|word vectors|decentralized graphs|graph learning/i],
  ['secure-iot', /data aggregation|crowdsensing|crowdsourcing|detour tasking|wban|data collection|task assignment/i],
  ['secure-comm', /differential-chaos-shift-keying|dcsk|secure communication|ofdm/i],
  ['memristor-neuron', /memristi|memristor|neuron|hopfield|rulkov|h[eé]non|neural network/i],
  ['chaotic-system', /chaotic|chaos|chaotification|cat map|lyapunov|hyperchaot|logistic|sine map|fractal|prng|bifurcation|pascal matrix/i],
];

const FALLBACK = { crypto: 'crypto-other', multimedia: 'media-other', nonlinear: 'chaotic-system' };

function fineKey(title, coarse) {
  for (const [key, re] of RULES) if (re.test(title)) return key;
  return FALLBACK[coarse] ?? coarse;
}

const src = fs.readFileSync(BIB, 'utf8');
const blocks = src.split(/(?=^@)/m);
const dist = {};
const sample = [];
const out = blocks.map((block) => {
  if (!block.startsWith('@')) return block;
  const title = (block.match(/title = \{([^}]*)\}/) || [])[1] || '';
  const coarse = (block.match(/category = \{([^}]*)\}/) || [])[1] || '';
  const fine = fineKey(title, coarse);
  dist[fine] = (dist[fine] || 0) + 1;
  if (sample.length < 0) sample.push([fine, title]);
  return block.replace(/category = \{[^}]*\}/, `category = {${fine}}`);
});

fs.writeFileSync(BIB, out.join(''));
console.log('Fine-key distribution:');
Object.entries(dist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}  ${k}`));
console.log('total:', Object.values(dist).reduce((a, b) => a + b, 0));
