/**
 * DES Simulator - UI Controller dengan penjelasan rumus
 */
document.addEventListener('DOMContentLoaded', () => {
  const inputField = document.getElementById('input-data');
  const keyField = document.getElementById('input-key');
  const btnProcess = document.getElementById('btn-process');
  const btnReset = document.getElementById('btn-reset');
  const btnRoundTrip = document.getElementById('btn-roundtrip');
  const errorBox = document.getElementById('error-box');
  const form = document.getElementById('des-form');

  const resultSection = document.getElementById('result-section');
  const outputBinary = document.getElementById('output-binary');
  const outputHex = document.getElementById('output-hex');
  const keyScheduleContainer = document.getElementById('key-schedule');
  const processContainer = document.getElementById('process-steps');
  const roundTripResult = document.getElementById('roundtrip-result');
  const learningOverview = document.getElementById('learning-overview');

  btnProcess.addEventListener('click', () => processDES());
  btnReset.addEventListener('click', () => resetAll());
  btnRoundTrip.addEventListener('click', () => runRoundTrip());
  form.addEventListener('submit', (e) => { e.preventDefault(); processDES(); });

  learningOverview.innerHTML = DesFormulas.formulaBox('overview');

  function getMode() {
    return document.querySelector('input[name="mode"]:checked').value;
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.add('visible');
  }

  function hideError() {
    errorBox.classList.remove('visible');
    errorBox.textContent = '';
  }

  function formatBits(str, groupSize) {
    const groups = [];
    for (let i = 0; i < str.length; i += groupSize) {
      groups.push(str.substr(i, groupSize));
    }
    return groups.join(' ');
  }

  function renderKeySchedule(keySchedule) {
    keyScheduleContainer.innerHTML = '';
    keyScheduleContainer.insertAdjacentHTML('afterbegin', DesFormulas.formulaBox('keySchedule'));

    keySchedule.forEach(step => {
      const card = document.createElement('div');
      card.className = 'step-card';

      if (step.step === 'PC-1') {
        card.innerHTML = `
          ${DesFormulas.formulaBox('pc1')}
          <h4>${step.step} — ${step.description}</h4>
          <div class="data-row"><label>Input K (64 bit):</label><span class="mono">${formatBits(step.input, 8)}</span></div>
          <div class="data-row"><label>Output K⁺ (56 bit):</label><span class="mono">${formatBits(step.output, 7)}</span></div>
          <div class="formula-instance">
            <span class="formula-label">Aturan:</span>
            Bit ke-j dari K⁺ = bit ke-PC-1[j] dari K &nbsp;→&nbsp; 64 bit menjadi 56 bit
          </div>
        `;
      } else if (step.step === 'Split C0/D0') {
        card.innerHTML = `
          ${DesFormulas.formulaBox('splitCD')}
          <h4>${step.step} — ${step.description}</h4>
          <div class="data-row"><label>C₀ (28 bit):</label><span class="mono">${formatBits(step.C, 4)}</span></div>
          <div class="data-row"><label>D₀ (28 bit):</label><span class="mono">${formatBits(step.D, 4)}</span></div>
        `;
      } else if (step.step === 'Key Schedule Rounds') {
        card.innerHTML = `
          ${DesFormulas.formulaBox('pc2')}
          <h4>${step.description}</h4>
          <div class="formula-instance shift-table-wrap">
            <span class="formula-label">Jadwal Left Shift sh(i):</span>
            <code>${DesFormulas.SHIFT_SCHEDULE}</code>
            <p class="formula-note">C<sub>i</sub> = LS<sub>sh(i)</sub>(C<sub>i−1</sub>) · D<sub>i</sub> = LS<sub>sh(i)</sub>(D<sub>i−1</sub>) · K<sub>i</sub> = PC-2(C<sub>i</sub>‖D<sub>i</sub>)</p>
          </div>
        `;
        const table = document.createElement('table');
        table.className = 'schedule-table';
        table.innerHTML = `
          <thead>
            <tr>
              <th>Round</th>
              <th>LS</th>
              <th>Ci (28 bit)</th>
              <th>Di (28 bit)</th>
              <th>Ki = PC-2(Ci‖Di)</th>
            </tr>
          </thead>
          <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        step.rounds.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>K${r.round}</td>
            <td title="LS${r.shift}(Ci-1), LS${r.shift}(Di-1)">« ${r.shift}</td>
            <td class="mono">${formatBits(r.C, 4)}</td>
            <td class="mono">${formatBits(r.D, 4)}</td>
            <td class="mono">${formatBits(r.subkey, 6)}</td>
          `;
          tbody.appendChild(tr);
        });
        card.appendChild(table);
      }

      keyScheduleContainer.appendChild(card);
    });
  }

  function renderSboxTable(lookups) {
    const wrap = document.createElement('div');
    wrap.innerHTML = DesFormulas.formulaBox('sbox');

    const calcs = document.createElement('div');
    calcs.className = 'sbox-formulas-list';
    lookups.forEach(l => {
      calcs.insertAdjacentHTML('beforeend', DesFormulas.sboxInstanceFormula(l));
    });
    wrap.appendChild(calcs);

    const table = document.createElement('table');
    table.className = 'sbox-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>S-Box</th>
          <th>Input B (6 bit)</th>
          <th>Rumus Baris</th>
          <th>Rumus Kolom</th>
          <th>Output</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    lookups.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>S${l.sbox}</td>
        <td class="mono">${l.input.match(/.{1,2}/g).join(' ')}</td>
        <td class="calc-cell">${l.rowCalc || `${l.row}`}</td>
        <td class="calc-cell">${l.colCalc || `${l.col}`}</td>
        <td class="mono">${l.outputDecimal} → ${l.output}</td>
      `;
      tbody.appendChild(tr);
    });
    wrap.appendChild(table);
    return wrap;
  }

  function renderProcessSteps(steps, mode) {
    processContainer.innerHTML = '';
    const modeLabel = mode === 'encrypt' ? 'Enkripsi' : 'Dekripsi';
    const modeNote = mode === 'encrypt'
      ? 'Subkunci digunakan K₁ → K₁₆'
      : 'Subkunci digunakan K₁₆ → K₁ (urutan terbalik)';

    processContainer.insertAdjacentHTML('afterbegin', `
      <div class="formula-card mode-info">
        <div class="formula-card-header">Mode: ${modeLabel}</div>
        <div class="formula-card-body"><p>${modeNote}</p></div>
      </div>
    `);

    steps.forEach(step => {
      const card = document.createElement('div');
      card.className = 'step-card';

      if (step.step === 'IP') {
        card.innerHTML = `
          ${DesFormulas.formulaBox('ip')}
          <h4>${step.step} — ${step.description}</h4>
          <div class="data-row"><label>Input X:</label><span class="mono">${formatBits(step.input, 8)}</span></div>
          <div class="data-row"><label>Output X⁺ = IP(X):</label><span class="mono">${formatBits(step.output, 8)}</span></div>
        `;
      } else if (step.step === 'Split L0/R0') {
        card.innerHTML = `
          ${DesFormulas.formulaBox('splitLR')}
          <h4>${step.step} — ${step.description}</h4>
          <div class="data-row"><label>L₀ = X⁺[1..32]:</label><span class="mono">${formatBits(step.L, 4)}</span></div>
          <div class="data-row"><label>R₀ = X⁺[33..64]:</label><span class="mono">${formatBits(step.R, 4)}</span></div>
        `;
      } else if (step.step === '16 Feistel Rounds') {
        card.innerHTML = `<h4>${step.description}</h4>`;

        step.rounds.forEach(r => {
          const roundCard = document.createElement('details');
          roundCard.className = 'round-detail';
          roundCard.open = r.round <= 2;

          roundCard.innerHTML = `
            <summary>Round ${r.round} — Subkey K${r.subkeyIndex}</summary>
            <div class="round-body">
              ${DesFormulas.roundFormulas(r)}

              <h5>① Input Putaran</h5>
              <div class="data-row"><label>L<sub>${r.round - 1}</sub>:</label><span class="mono">${formatBits(r.L_in, 4)}</span></div>
              <div class="data-row"><label>R<sub>${r.round - 1}</sub>:</label><span class="mono">${formatBits(r.R_in, 4)}</span></div>
              <div class="data-row"><label>K<sub>${r.subkeyIndex}</sub>:</label><span class="mono">${formatBits(r.subkey, 6)}</span></div>

              <h5>② Ekspansi E — f(R, K) langkah 1</h5>
              ${DesFormulas.formulaBox('expansion')}
              <div class="formula-instance"><code>E(R<sub>${r.round - 1}</sub>)</code> → 48 bit:</div>
              <div class="data-row mono">${formatBits(r.expanded, 6)}</div>

              <h5>③ XOR dengan Subkey</h5>
              ${DesFormulas.formulaBox('xorSubkey')}
              <div class="formula-instance">
                <code>B = E(R<sub>${r.round - 1}</sub>) ⊕ K<sub>${r.subkeyIndex}</sub></code>
              </div>
              <div class="data-row mono">${formatBits(r.xored, 6)}</div>

              <h5>④ Substitusi S-Box</h5>
              <div class="sbox-slot"></div>
              <div class="data-row"><label>Output gabungan S-Box (32 bit):</label><span class="mono">${formatBits(r.sboxOutput, 4)}</span></div>

              <h5>⑤ Permutasi P</h5>
              ${DesFormulas.formulaBox('pPerm')}
              <div class="formula-instance"><code>f(R, K) = P(...)</code> → 32 bit:</div>
              <div class="data-row mono">${formatBits(r.pOutput, 4)}</div>

              <h5>⑥ Hasil Swap Feistel</h5>
              <div class="formula-instance">
                <code>L<sub>${r.round}</sub> = R<sub>${r.round - 1}</sub></code><br>
                <code>R<sub>${r.round}</sub> = L<sub>${r.round - 1}</sub> ⊕ f(R<sub>${r.round - 1}</sub>, K<sub>${r.subkeyIndex}</sub>)</code>
              </div>
              <div class="data-row"><label>L<sub>${r.round}</sub>:</label><span class="mono">${formatBits(r.L_out, 4)}</span></div>
              <div class="data-row"><label>R<sub>${r.round}</sub>:</label><span class="mono">${formatBits(r.R_out, 4)}</span></div>
            </div>
          `;

          roundCard.querySelector('.sbox-slot').appendChild(renderSboxTable(r.sboxLookups));
          card.appendChild(roundCard);
        });
      } else if (step.step === 'Pre-Swap') {
        card.innerHTML = `
          ${DesFormulas.formulaBox('preSwap')}
          <h4>${step.step} — ${step.description}</h4>
          <div class="data-row mono">${formatBits(step.output, 8)}</div>
        `;
      } else if (step.step === 'Final Swap') {
        card.innerHTML = `
          ${DesFormulas.formulaBox('finalSwap')}
          <h4>${step.step} — ${step.description}</h4>
          <div class="data-row mono">${formatBits(step.output, 8)}</div>
        `;
      } else if (step.step === 'IP⁻¹') {
        card.innerHTML = `
          ${DesFormulas.formulaBox('ipInv')}
          <h4>${step.step} — ${step.description}</h4>
          <div class="data-row"><label>Input (R₁₆‖L₁₆):</label><span class="mono">${formatBits(step.input, 8)}</span></div>
          <div class="data-row highlight"><label>Output Akhir:</label><span class="mono">${formatBits(step.output, 8)}</span></div>
        `;
      }

      processContainer.appendChild(card);
    });
  }

  function processDES() {
    hideError();
    roundTripResult.innerHTML = '';

    try {
      const result = DesEngine.run(inputField.value, keyField.value, getMode());
      resultSection.classList.add('visible');
      outputBinary.textContent = formatBits(result.outputBinary, 8);
      outputHex.textContent = result.outputHex;
      renderKeySchedule(result.keySchedule);
      renderProcessSteps(result.process, result.mode);
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      showError(err.message);
    }
  }

  function runRoundTrip() {
    hideError();
    try {
      const test = DesEngine.roundTripTest(inputField.value, keyField.value);
      resultSection.classList.add('visible');
      renderKeySchedule(test.encrypted.keySchedule);
      renderProcessSteps(test.encrypted.process, 'encrypt');
      outputBinary.textContent = formatBits(test.encrypted.outputBinary, 8);
      outputHex.textContent = test.encrypted.outputHex;

      roundTripResult.innerHTML = `
        <div class="roundtrip-box ${test.success ? 'success' : 'fail'}">
          <h4>Round-Trip Test ${test.success ? '✓ BERHASIL' : '✗ GAGAL'}</h4>
          ${DesFormulas.formulaBox('overview')}
          <div class="data-row"><label>Plaintext:</label> ${test.original}</div>
          <div class="data-row"><label>Enkripsi → Ciphertext:</label> ${test.encrypted.outputHex}</div>
          <div class="data-row"><label>Dekripsi ulang:</label> ${test.recovered}</div>
          <p class="formula-note">${test.success
            ? 'Membuktikan: Decrypt(Encrypt(P)) = P — operasi dekripsi = invers enkripsi dengan subkunci terbalik.'
            : 'Hasil dekripsi tidak cocok dengan plaintext asli.'}</p>
        </div>
      `;
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      showError(err.message);
    }
  }

  function resetAll() {
    inputField.value = '';
    keyField.value = '';
    document.getElementById('mode-encrypt').checked = true;
    hideError();
    resultSection.classList.remove('visible');
    keyScheduleContainer.innerHTML = '';
    processContainer.innerHTML = '';
    roundTripResult.innerHTML = '';
    outputBinary.textContent = '—';
    outputHex.textContent = '—';
  }

  inputField.value = '0123456789ABCDEF';
  keyField.value = '133457799BBCDFF1';
});
