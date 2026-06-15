/**
 * DES Core Engine dengan pelacakan langkah detail
 */
const DesEngine = (function () {
  'use strict';

  function parseInput(value, label) {
    const trimmed = value.trim().replace(/\s+/g, '');
    if (!trimmed) {
      throw new Error(`${label} tidak boleh kosong.`);
    }

    let bits;
    if (/^(0x)?[0-9a-fA-F]+$/.test(trimmed)) {
      const hex = trimmed.replace(/^0x/i, '');
      if (hex.length > 16) {
        throw new Error(`${label} heksadesimal maksimal 16 karakter (64 bit).`);
      }
      const padded = hex.padStart(16, '0');
      bits = hexToBits(padded);
    } else if (/^[01]+$/.test(trimmed)) {
      if (trimmed.length > 64) {
        throw new Error(`${label} biner maksimal 64 bit.`);
      }
      bits = trimmed.padStart(64, '0').split('').map(Number);
    } else {
      throw new Error(`${label} harus berupa biner (0/1) atau heksadesimal.`);
    }

    return bits;
  }

  function hexToBits(hex) {
    return hex.split('').map(c => {
      return parseInt(c, 16).toString(2).padStart(4, '0');
    }).join('').split('').map(Number);
  }

  function bitsToHex(bits) {
    const str = bits.join('');
    let hex = '';
    for (let i = 0; i < str.length; i += 4) {
      hex += parseInt(str.substr(i, 4), 2).toString(16).toUpperCase();
    }
    return hex;
  }

  function bitsToString(bits) {
    return bits.join('');
  }

  function permute(bits, table) {
    return table.map(pos => bits[pos - 1]);
  }

  function leftShift(bits, n) {
    const copy = bits.slice();
    for (let i = 0; i < n; i++) {
      copy.push(copy.shift());
    }
    return copy;
  }

  function xor(a, b) {
    return a.map((bit, i) => bit ^ b[i]);
  }

  function generateKeySchedule(keyBits) {
    const steps = [];
    const pc1Result = permute(keyBits, DES.PC1);
    steps.push({
      step: 'PC-1',
      description: 'Permutasi PC-1: 64 bit → 56 bit',
      input: bitsToString(keyBits),
      output: bitsToString(pc1Result),
      outputBits: pc1Result.slice()
    });

    let C = pc1Result.slice(0, 28);
    let D = pc1Result.slice(28, 56);

    steps.push({
      step: 'Split C0/D0',
      description: 'Pembagian menjadi C0 (28 bit) dan D0 (28 bit)',
      C: bitsToString(C),
      D: bitsToString(D),
      Cbits: C.slice(),
      Dbits: D.slice()
    });

    const subkeys = [];
    const roundDetails = [];

    for (let round = 0; round < 16; round++) {
      const shift = DES.SHIFTS[round];
      C = leftShift(C, shift);
      D = leftShift(D, shift);
      const combined = C.concat(D);
      const subkey = permute(combined, DES.PC2);

      subkeys.push(subkey);
      roundDetails.push({
        round: round + 1,
        shift: shift,
        C: bitsToString(C),
        D: bitsToString(D),
        combined: bitsToString(combined),
        subkey: bitsToString(subkey),
        subkeyBits: subkey.slice()
      });
    }

    steps.push({
      step: 'Key Schedule Rounds',
      description: '16 putaran pergeseran kiri (LS) dan PC-2',
      rounds: roundDetails
    });

    return { subkeys, steps };
  }

  function fFunction(R, subkey) {
    const expanded = permute(R, DES.E);
    const xored = xor(expanded, subkey);

    const sboxLookups = [];
    const sboxOutput = [];

    for (let i = 0; i < 8; i++) {
      const block = xored.slice(i * 6, i * 6 + 6);
      const row = block[0] * 2 + block[5];
      const col = block[1] * 8 + block[2] * 4 + block[3] * 2 + block[4];
      const val = DES.SBOX[i][row][col];
      const valBits = val.toString(2).padStart(4, '0').split('').map(Number);

      sboxLookups.push({
        sbox: i + 1,
        input: bitsToString(block),
        row: row,
        col: col,
        rowCalc: `${block[0]}×2 + ${block[5]} = ${row}`,
        colCalc: `${block[1]}×8 + ${block[2]}×4 + ${block[3]}×2 + ${block[4]} = ${col}`,
        outputDecimal: val,
        output: bitsToString(valBits)
      });
      sboxOutput.push(...valBits);
    }

    const pResult = permute(sboxOutput, DES.P);

    return {
      expanded: expanded.slice(),
      xored: xored.slice(),
      sboxLookups,
      sboxOutput: sboxOutput.slice(),
      result: pResult.slice()
    };
  }

  function processBlock(inputBits, subkeys, mode) {
    const steps = [];
    const keys = mode === 'decrypt' ? subkeys.slice().reverse() : subkeys;

    const ipResult = permute(inputBits, DES.IP);
    steps.push({
      step: 'IP',
      description: 'Initial Permutation',
      input: bitsToString(inputBits),
      output: bitsToString(ipResult)
    });

    let L = ipResult.slice(0, 32);
    let R = ipResult.slice(32, 64);

    steps.push({
      step: 'Split L0/R0',
      description: 'Pembagian blok 64 bit menjadi L0 dan R0 (masing-masing 32 bit)',
      L: bitsToString(L),
      R: bitsToString(R)
    });

    const rounds = [];

    for (let i = 0; i < 16; i++) {
      const prevL = L.slice();
      const prevR = R.slice();
      const fResult = fFunction(R, keys[i]);
      const newR = xor(L, fResult.result);

      rounds.push({
        round: i + 1,
        subkeyIndex: mode === 'decrypt' ? 16 - i : i + 1,
        subkey: bitsToString(keys[i]),
        L_in: bitsToString(prevL),
        R_in: bitsToString(prevR),
        expanded: bitsToString(fResult.expanded),
        xored: bitsToString(fResult.xored),
        sboxLookups: fResult.sboxLookups,
        sboxOutput: bitsToString(fResult.sboxOutput),
        pOutput: bitsToString(fResult.result),
        L_out: bitsToString(prevR),
        R_out: bitsToString(newR),
        swapNote: `L${i + 1} = R${i}, R${i + 1} = L${i} ⊕ f(R${i}, K${mode === 'decrypt' ? 16 - i : i + 1})`
      });

      L = prevR;
      R = newR;
    }

    steps.push({
      step: '16 Feistel Rounds',
      description: '16 putaran Feistel Network',
      rounds: rounds
    });

    const preSwap = L.concat(R);
    steps.push({
      step: 'Pre-Swap',
      description: 'Gabungan L16 || R16 sebelum swap akhir',
      output: bitsToString(preSwap)
    });

    const swapped = R.concat(L);
    steps.push({
      step: 'Final Swap',
      description: 'Swap akhir: R16 || L16',
      output: bitsToString(swapped)
    });

    const finalResult = permute(swapped, DES.IP_INV);
    steps.push({
      step: 'IP⁻¹',
      description: 'Inverse Initial Permutation',
      input: bitsToString(swapped),
      output: bitsToString(finalResult)
    });

    return {
      output: finalResult,
      outputBinary: bitsToString(finalResult),
      outputHex: bitsToHex(finalResult),
      steps
    };
  }

  function run(inputValue, keyValue, mode) {
    const inputBits = parseInput(inputValue, 'Input');
    const keyBits = parseInput(keyValue, 'Kunci');

    const keySchedule = generateKeySchedule(keyBits);
    const result = processBlock(inputBits, keySchedule.subkeys, mode);

    return {
      mode,
      inputBinary: bitsToString(inputBits),
      inputHex: bitsToHex(inputBits),
      keyBinary: bitsToString(keyBits),
      keyHex: bitsToHex(keyBits),
      keySchedule: keySchedule.steps,
      subkeys: keySchedule.steps[2].rounds.map(r => ({
        round: r.round,
        key: r.subkey
      })),
      process: result.steps,
      outputBinary: result.outputBinary,
      outputHex: result.outputHex
    };
  }

  function roundTripTest(plaintext, key) {
    const encrypted = run(plaintext, key, 'encrypt');
    const decrypted = run(encrypted.outputHex, key, 'decrypt');
    const originalNorm = encrypted.inputHex.toUpperCase();
    const recoveredNorm = decrypted.outputHex.toUpperCase();

    return {
      encrypted,
      decrypted,
      success: originalNorm === recoveredNorm,
      original: originalNorm,
      recovered: recoveredNorm
    };
  }

  return {
    run,
    roundTripTest,
    parseInput,
    bitsToHex,
    bitsToString
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.DesEngine = DesEngine;
}
