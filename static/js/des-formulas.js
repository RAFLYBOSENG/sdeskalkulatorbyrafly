/**
 * Rumus & Penjelasan Edukasi DES (FIPS 46-3)
 */
const DesFormulas = (function () {
  'use strict';

  const SHIFT_SCHEDULE = '1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1';

  const sections = {
    overview: {
      title: 'Gambaran Alur DES',
      html: `
        <p>DES memproses blok data <strong>64 bit</strong> dengan kunci <strong>64 bit</strong> (56 bit efektif).
        Alur utama terdiri dari dua bagian:</p>
        <ol>
          <li><strong>Key Schedule</strong> — menghasilkan 16 subkunci K₁…K₁₆ (masing-masing 48 bit)</li>
          <li><strong>Feistel Network</strong> — 16 putaran enkripsi/dekripsi pada blok data</li>
        </ol>
        <div class="formula-block">
          <span class="formula-label">Rumus Feistel (putaran ke-i):</span>
          <code>L<sub>i</sub> = R<sub>i−1</sub></code><br>
          <code>R<sub>i</sub> = L<sub>i−1</sub> ⊕ f(R<sub>i−1</sub>, K<sub>i</sub>)</code>
        </div>
        <div class="formula-block">
          <span class="formula-label">Fungsi f (F-function):</span>
          <code>f(R, K) = P(S(E(R) ⊕ K))</code>
          <p class="formula-note">E = ekspansi 32→48 bit · S = substitusi S-Box · P = permutasi 32 bit</p>
        </div>
      `
    },

    pc1: {
      title: 'PC-1 — Permuted Choice 1',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus:</span>
          <code>K⁺ = PC-1(K)</code>
        </div>
        <p>Memilih <strong>56 bit</strong> dari kunci 64 bit (8 bit parity di posisi 8, 16, 24, …, 64 dibuang).</p>
        <ul class="formula-rules">
          <li>Input: K (64 bit) — kunci asli</li>
          <li>Output: K⁺ (56 bit) — kunci terpermute</li>
          <li>Bit ke-i output = bit ke-<em>PC-1[i]</em> dari input (penomoran FIPS dimulai dari 1)</li>
        </ul>
      `
    },

    splitCD: {
      title: 'Pembagian C₀ / D₀',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus:</span>
          <code>C₀ = K⁺[1..28]</code> &nbsp;·&nbsp; <code>D₀ = K⁺[29..56]</code>
        </div>
        <p>K⁺ (56 bit) dibagi menjadi dua setengah masing-masing <strong>28 bit</strong> untuk pergeseran sirkuler independen.</p>
      `
    },

    keySchedule: {
      title: 'Key Schedule — Pembangkitan Subkunci',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus per putaran i = 1…16:</span>
          <code>C<sub>i</sub> = LS<sub>sh(i)</sub>(C<sub>i−1</sub>)</code><br>
          <code>D<sub>i</sub> = LS<sub>sh(i)</sub>(D<sub>i−1</sub>)</code><br>
          <code>K<sub>i</sub> = PC-2(C<sub>i</sub> ‖ D<sub>i</sub>)</code>
        </div>
        <ul class="formula-rules">
          <li><strong>LS<sub>n</sub></strong> = pergeseran sirkuler ke kiri sebanyak n bit</li>
          <li><strong>sh(i)</strong> = jumlah shift putaran ke-i dari jadwal: ${SHIFT_SCHEDULE}</li>
          <li><strong>PC-2</strong> memilih 48 bit dari gabungan 56 bit → subkunci K<sub>i</sub></li>
          <li>Dekripsi menggunakan K₁₆, K₁₅, …, K₁ (urutan terbalik)</li>
        </ul>
      `
    },

    pc2: {
      title: 'PC-2 — Permuted Choice 2',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus:</span>
          <code>K<sub>i</sub> = PC-2(C<sub>i</sub> ‖ D<sub>i</sub>)</code>
        </div>
        <p>Memilih dan mempermute <strong>48 bit</strong> dari 56 bit gabungan C<sub>i</sub>D<sub>i</sub>.</p>
      `
    },

    ip: {
      title: 'IP — Initial Permutation',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus:</span>
          <code>X⁺ = IP(X)</code>
        </div>
        <p>Mempermutasi 64 bit input sebelum masuk ke jaringan Feistel. Bukan langkah kriptografis (tidak menambah keamanan), melainkan reordering sesuai standar FIPS.</p>
        <ul class="formula-rules">
          <li>Bit ke-j dari output = bit ke-<em>IP[j]</em> dari input</li>
        </ul>
      `
    },

    splitLR: {
      title: 'Pembagian L₀ / R₀',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus:</span>
          <code>L₀ = X⁺[1..32]</code> &nbsp;·&nbsp; <code>R₀ = X⁺[33..64]</code>
        </div>
        <p>Blok 64 bit setelah IP dibagi menjadi half-block kiri (L) dan kanan (R), masing-masing 32 bit.</p>
      `
    },

    feistelRound: {
      title: 'Putaran Feistel',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus putaran ke-i:</span>
          <code>L<sub>i</sub> = R<sub>i−1</sub></code><br>
          <code>R<sub>i</sub> = L<sub>i−1</sub> ⊕ f(R<sub>i−1</sub>, K<sub>i</sub>)</code>
        </div>
        <p>Operasi ⊕ adalah <strong>XOR bitwise</strong> (penjumlahan modulo-2 per bit).</p>
      `
    },

    expansion: {
      title: 'E — Expansion Permutation',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus:</span>
          <code>E(R) = perluas R dari 32 bit → 48 bit</code>
        </div>
        <p>Tabel E menduplikasi beberapa bit R sehingga setiap grup 4 bit menjadi 6 bit, siap untuk XOR dengan subkunci 48 bit.</p>
        <ul class="formula-rules">
          <li>Input: R (32 bit) · Output: E(R) (48 bit)</li>
          <li>Bit ke-j dari E(R) = bit ke-<em>E[j]</em> dari R</li>
        </ul>
      `
    },

    xorSubkey: {
      title: 'XOR dengan Subkey',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus:</span>
          <code>B = E(R) ⊕ K<sub>i</sub></code>
        </div>
        <p>Hasil XOR (48 bit) dibagi menjadi <strong>8 blok</strong> B₁…B₈, masing-masing <strong>6 bit</strong>, untuk lookup S-Box.</p>
        <code>B = B₁ B₂ B₃ B₄ B₅ B₆ B₇ B₈</code>
      `
    },

    sbox: {
      title: 'S-Box — Substitusi',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus lookup (untuk setiap B<sub>j</sub> 6 bit):</span>
          <code>baris = b₀ × 2 + b₅</code> &nbsp;(bit pertama &amp; terakhir)<br>
          <code>kolom = b₁×8 + b₂×4 + b₃×2 + b₄</code> &nbsp;(4 bit tengah)<br>
          <code>output = S<sub>j</sub>[baris][kolom]</code> &nbsp;(4 bit desimal 0–15)
        </div>
        <p>8 S-Box independen · Input 6 bit → Output 4 bit · Total 8×4 = <strong>32 bit</strong>.</p>
        <ul class="formula-rules">
          <li>S-Box adalah satu-satunya operasi <strong>non-linear</strong> dalam DES</li>
          <li>Menyediakan confusion — hubungan kompleks antara input dan output</li>
        </ul>
      `
    },

    pPerm: {
      title: 'P — Permutation',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus:</span>
          <code>f(R,K) = P(S₁(B₁) ‖ S₂(B₂) ‖ … ‖ S₈(B₈))</code>
        </div>
        <p>32 bit hasil S-Box dipermute ulang menjadi output fungsi f (32 bit).</p>
      `
    },

    preSwap: {
      title: 'Gabungan L₁₆ ‖ R₁₆',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus:</span>
          <code>Blok = L₁₆ ‖ R₁₆</code>
        </div>
        <p>Setelah 16 putaran, kedua half-block digabung (belum di-swap).</p>
      `
    },

    finalSwap: {
      title: 'Swap Akhir',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus:</span>
          <code>Preoutput = R₁₆ ‖ L₁₆</code>
        </div>
        <p><strong>Penting:</strong> Urutan dibalik — R₁₆ diletakkan di depan, L₁₆ di belakang, sebelum IP⁻¹.</p>
      `
    },

    ipInv: {
      title: 'IP⁻¹ — Inverse Initial Permutation',
      html: `
        <div class="formula-block">
          <span class="formula-label">Rumus:</span>
          <code>Ciphertext = IP⁻¹(R₁₆ ‖ L₁₆)</code>
        </div>
        <p>Permutasi invers dari IP. Menghasilkan <strong>64 bit output akhir</strong> (ciphertext atau plaintext).</p>
      `
    }
  };

  function formulaBox(key) {
    const sec = sections[key];
    if (!sec) return '';
    return `
      <div class="formula-card">
        <div class="formula-card-header">📐 ${sec.title}</div>
        <div class="formula-card-body">${sec.html}</div>
      </div>
    `;
  }

  function sboxRowFormula(lookup) {
    const b = lookup.input.split('').map(Number);
    return `baris = b₀×2 + b₅ = ${b[0]}×2 + ${b[5]} = <strong>${lookup.row}</strong>`;
  }

  function sboxColFormula(lookup) {
    const b = lookup.input.split('').map(Number);
    return `kolom = ${b[1]}×8 + ${b[2]}×4 + ${b[3]}×2 + ${b[4]} = ${b[1]*8}+${b[2]*4}+${b[3]*2}+${b[4]} = <strong>${lookup.col}</strong>`;
  }

  function sboxInstanceFormula(lookup) {
    return `
      <div class="sbox-formula-item">
        <strong>S${lookup.sbox}</strong> — Input: <code>${lookup.input.match(/.{1,2}/g).join(' ')}</code>
        <div class="sbox-calc">${sboxRowFormula(lookup)}</div>
        <div class="sbox-calc">${sboxColFormula(lookup)}</div>
        <div class="sbox-calc">S${lookup.sbox}[${lookup.row}][${lookup.col}] = <strong>${lookup.outputDecimal}</strong> → biner <code>${lookup.output}</code></div>
      </div>
    `;
  }

  function roundFormulas(r) {
    const n = r.round;
    const k = r.subkeyIndex;
    const prev = n - 1;
    return `
      ${formulaBox('feistelRound')}
      <div class="formula-instance">
        <span class="formula-label">Perhitungan Round ${n}:</span>
        <code>L<sub>${n}</sub> = R<sub>${prev}</sub></code><br>
        <code>R<sub>${n}</sub> = L<sub>${prev}</sub> ⊕ f(R<sub>${prev}</sub>, K<sub>${k}</sub>)</code>
      </div>
    `;
  }

  function xorInstanceFormula(expanded, subkey, xored) {
    return `
      <div class="formula-instance">
        <span class="formula-label">Contoh perhitungan XOR (bit ke-1 dari setiap grup 6 bit):</span>
        <p class="formula-note">E(R) ⊕ K = B — XOR dilakukan per bit pada 48 bit</p>
      </div>
    `;
  }

  return {
    sections,
    formulaBox,
    sboxInstanceFormula,
    sboxRowFormula,
    sboxColFormula,
    roundFormulas,
    xorInstanceFormula,
    SHIFT_SCHEDULE
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.DesFormulas = DesFormulas;
}
