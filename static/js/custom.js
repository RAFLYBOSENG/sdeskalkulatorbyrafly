// Theme Management (Light / Dark Mode)
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initBitBoxes();
    initLearningMode();
    initBackToTop();
    initSboxSimulator();
    initSidebarScrollSpy();
});

// Theme logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark';
        themeToggle.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
    // Update theme toggle icon/label if present
    const icon = document.getElementById('themeToggleIcon');
    if (icon) {
        if (theme === 'dark') {
            icon.className = 'bi bi-moon-stars-fill text-info';
        } else {
            icon.className = 'bi bi-sun-fill text-warning';
        }
    }
}

// Learning Mode logic
function initLearningMode() {
    const learningToggle = document.getElementById('learningModeToggle');
    const container = document.getElementById('detailedOutput');
    
    if (learningToggle && container) {
        // Retrieve setting, default to true (educational simulator)
        const active = localStorage.getItem('learningMode') !== 'false';
        learningToggle.checked = active;
        toggleLearningModeClasses(active);

        learningToggle.addEventListener('change', (e) => {
            const state = e.target.checked;
            localStorage.setItem('learningMode', state);
            toggleLearningModeClasses(state);
        });
    }
}

function toggleLearningModeClasses(isActive) {
    const body = document.body;
    if (isActive) {
        body.classList.remove('learning-mode-disabled');
    } else {
        body.classList.add('learning-mode-disabled');
    }
}

// Clickable Bit Boxes Toggler
function initBitBoxes() {
    const plainInput = document.getElementById('inputText');
    const keyInput = document.getElementById('inputKey');

    if (plainInput) {
        renderBitBoxes(plainInput, 'plaintextBitGrid', 8);
        plainInput.addEventListener('input', () => {
            // Clean non-binary characters
            plainInput.value = plainInput.value.replace(/[^01]/g, '').substring(0, 8);
            updateBitBoxStates(plainInput, 'plaintextBitGrid');
        });
    }

    if (keyInput) {
        renderBitBoxes(keyInput, 'keyBitGrid', 10);
        keyInput.addEventListener('input', () => {
            keyInput.value = keyInput.value.replace(/[^01]/g, '').substring(0, 10);
            updateBitBoxStates(keyInput, 'keyBitGrid');
        });
    }
}

function renderBitBoxes(inputElement, gridId, numBits) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = '';
    const currentVal = inputElement.value.padEnd(numBits, '0');
    
    // Ensure input matches padded
    if (inputElement.value.length < numBits) {
        inputElement.value = currentVal;
    }

    for (let i = 0; i < numBits; i++) {
        const bitVal = currentVal[i];
        const box = document.createElement('div');
        box.className = `bit-box ${bitVal === '1' ? 'bit-one' : 'bit-zero'}`;
        box.innerText = bitVal;
        box.dataset.index = i;
        
        box.addEventListener('click', () => {
            const currentText = inputElement.value.split('');
            const newVal = currentText[i] === '1' ? '0' : '1';
            currentText[i] = newVal;
            inputElement.value = currentText.join('');
            
            box.innerText = newVal;
            box.className = `bit-box ${newVal === '1' ? 'bit-one' : 'bit-zero'}`;
        });
        
        grid.appendChild(box);
    }
}

function updateBitBoxStates(inputElement, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    const boxes = grid.querySelectorAll('.bit-box');
    const val = inputElement.value;
    
    boxes.forEach((box, i) => {
        const bitVal = val[i] || '0';
        box.innerText = bitVal;
        box.className = `bit-box ${bitVal === '1' ? 'bit-one' : 'bit-zero'}`;
    });
}

// Gunakan Contoh logic
function useExample() {
    const plainInput = document.getElementById('inputText');
    const keyInput = document.getElementById('inputKey');
    const form = document.getElementById('form');

    if (plainInput && keyInput && form) {
        // Typical S-DES textbook example
        plainInput.value = '10101101';
        keyInput.value = '1011011011';
        
        updateBitBoxStates(plainInput, 'plaintextBitGrid');
        updateBitBoxStates(keyInput, 'keyBitGrid');
        
        // Submit form automatically to trigger result
        form.submit();
    }
}

// Reset Simulator logic
function resetSimulator() {
    const plainInput = document.getElementById('inputText');
    const keyInput = document.getElementById('inputKey');
    
    if (plainInput && keyInput) {
        plainInput.value = '00000000';
        keyInput.value = '0000000000';
        updateBitBoxStates(plainInput, 'plaintextBitGrid');
        updateBitBoxStates(keyInput, 'keyBitGrid');
    }

    // Redirect or clear trace
    window.location.href = '/';
}

// Copy & Export functionalities
function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(message);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function showToast(message) {
    // Create modern alert toast dynamically
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '80px';
    container.style.right = '30px';
    container.style.zIndex = '9999';
    
    container.innerHTML = `
        <div class="alert alert-success d-flex align-items-center shadow-lg" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>
            <div>${message}</div>
        </div>
    `;
    document.body.appendChild(container);
    
    setTimeout(() => {
        container.remove();
    }, 2500);
}

// Export as TXT file
function exportToTxt(notesContent) {
    const blob = new Blob([notesContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sdes_simulator_perhitungan.txt';
    link.click();
    URL.revokeObjectURL(link.href);
}

// Export as PDF using browser printing styled layout
function exportToPdf() {
    const element = document.getElementById('printableArea');
    if (!element) return;
    
    // Check if html2pdf is loaded
    if (typeof html2pdf !== 'undefined') {
        const opt = {
            margin:       [10, 10, 10, 10],
            filename:     'sdes_learning_simulator.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Temporarily expand all accordions to capture steps in PDF
        const collapsedButtons = document.querySelectorAll('.accordion-button.collapsed');
        const collapsedCollapses = document.querySelectorAll('.accordion-collapse:not(.show)');
        
        // Expand
        collapsedCollapses.forEach(el => el.classList.add('show'));
        
        html2pdf().from(element).set(opt).save().then(() => {
            // Restore collapses
            collapsedCollapses.forEach((el, index) => {
                // If it wasn't originally open, close it
                el.classList.remove('show');
            });
        });
    } else {
        // Fallback to basic print window
        window.print();
    }
}

// S-Box visual lookup widget
function initSboxSimulator() {
    const inputField = document.getElementById('sboxSimInput');
    const sboxSelect = document.querySelectorAll('input[name="sboxSelect"]');
    
    if (inputField) {
        inputField.addEventListener('input', () => {
            inputField.value = inputField.value.replace(/[^01]/g, '').substring(0, 4);
            updateSboxHighlight();
        });
        
        sboxSelect.forEach(radio => {
            radio.addEventListener('change', updateSboxHighlight);
        });

        // Trigger default state
        updateSboxHighlight();
    }
}

function updateSboxHighlight() {
    const inputField = document.getElementById('sboxSimInput');
    if (!inputField) return;

    let bits = inputField.value.padEnd(4, '0');
    if (inputField.value.length < 4) {
        inputField.value = bits;
    }

    // Determine S-Box index (0 or 1)
    const selectedSboxRadio = document.querySelector('input[name="sboxSelect"]:checked');
    const sboxIndex = selectedSboxRadio ? parseInt(selectedSboxRadio.value) : 0;
    
    // Row bits (1st and 4th)
    const rowBits = bits[0] + bits[3];
    const rowDec = parseInt(rowBits, 2);
    
    // Col bits (2nd and 3rd)
    const colBits = bits[1] + bits[2];
    const colDec = parseInt(colBits, 2);
    
    // Select S-Box matrix
    // S0 and S1 definitions
    const sboxMatrices = [
        [
            [1, 0, 3, 2],
            [3, 2, 1, 0],
            [0, 2, 1, 3],
            [3, 1, 3, 2]
        ],
        [
            [0, 1, 2, 3],
            [2, 0, 1, 3],
            [3, 0, 1, 0],
            [2, 1, 0, 3]
        ]
    ];
    
    const sboxName = sboxIndex === 0 ? 'S0' : 'S1';
    const resultVal = sboxMatrices[sboxIndex][rowDec][colDec];
    const resultBin = resultVal.toString(2).padStart(2, '0');

    // Highlight row, column and cell in UI
    const targetTableId = sboxIndex === 0 ? 'tableS0' : 'tableS1';
    const otherTableId = sboxIndex === 0 ? 'tableS1' : 'tableS0';
    
    // Reset highlights on both tables
    clearTableHighlights(targetTableId);
    clearTableHighlights(otherTableId);
    
    const tableEl = document.getElementById(targetTableId);
    if (tableEl) {
        // Table row index is rowDec + 1 (because header row is index 0)
        const rows = tableEl.querySelectorAll('tbody tr');
        if (rows[rowDec]) {
            // Apply row highlights (cells 1 to 4)
            const cells = rows[rowDec].querySelectorAll('td');
            // Col index is colDec + 1 (since header column is index 0)
            cells.forEach((cell, idx) => {
                if (idx === colDec + 1) {
                    cell.className = 'highlight-cell';
                } else if (idx > 0) {
                    cell.className = 'highlight-row';
                }
            });
        }
        
        // Highlight columns in all rows
        rows.forEach((tr, rIdx) => {
            if (rIdx !== rowDec) {
                const cells = tr.querySelectorAll('td');
                if (cells[colDec + 1]) {
                    cells[colDec + 1].className = 'highlight-col';
                }
            }
        });
    }

    // Display Explanation in Info boxes
    const sboxInfoBits = document.getElementById('sboxInfoBits');
    const sboxInfoResult = document.getElementById('sboxInfoResult');
    const sboxInfoExplain = document.getElementById('sboxInfoExplain');
    
    if (sboxInfoBits) {
        sboxInfoBits.innerHTML = `
            <strong>Bit Input:</strong> 
            <span class="badge bg-secondary">${bits[0]}</span>
            <span class="badge bg-primary">${bits[1]}</span>
            <span class="badge bg-primary">${bits[2]}</span>
            <span class="badge bg-secondary">${bits[3]}</span>
        `;
    }
    
    if (sboxInfoExplain) {
        sboxInfoExplain.innerHTML = `
            <div class="mb-2">
                <i class="bi bi-arrow-right-short text-primary"></i> 
                <strong>Baris (Bit 1 & 4):</strong> ${bits[0]}${bits[3]} &rarr; Desimal: <strong>${rowDec}</strong> (baris ke-${rowDec})
            </div>
            <div>
                <i class="bi bi-arrow-right-short text-primary"></i> 
                <strong>Kolom (Bit 2 & 3):</strong> ${bits[1]}${bits[2]} &rarr; Desimal: <strong>${colDec}</strong> (kolom ke-${colDec})
            </div>
        `;
    }

    if (sboxInfoResult) {
        sboxInfoResult.innerHTML = `
            Hasil Lookup ${sboxName}[${rowDec}][${colDec}]: <br>
            <span class="fs-3 fw-bold text-success">${resultVal}</span> 
            <span class="text-secondary">(biner: ${resultBin})</span>
        `;
    }
}

function clearTableHighlights(tableId) {
    const tableEl = document.getElementById(tableId);
    if (!tableEl) return;
    
    const tds = tableEl.querySelectorAll('td');
    tds.forEach(td => {
        td.className = '';
    });
}

// Scroll functionality (Back to Top)
function initBackToTop() {
    const btn = document.getElementById('backToTopBtn');
    if (!btn) return;
    
    window.addEventListener('scroll', () => {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Sidebar ScrollSpy highlighting
function initSidebarScrollSpy() {
    const links = document.querySelectorAll('.navigator-item');
    const sections = Array.from(links).map(link => {
        const hash = link.getAttribute('href');
        return document.querySelector(hash);
    }).filter(sec => sec !== null);

    if (sections.length === 0) return;

    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 120; // adjust offset for navbar
        
        sections.forEach(sec => {
            const secTop = sec.offsetTop;
            if (scrollPosition >= secTop) {
                currentSectionId = '#' + sec.getAttribute('id');
            }
        });

        links.forEach(link => {
            if (link.getAttribute('href') === currentSectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    });
}
