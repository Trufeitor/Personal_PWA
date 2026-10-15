// Personal XT+ - Lógica Principal, Criptografía, Búsqueda Tokenizada y Seguridad

// Registro de Service Worker para funcionamiento 100% Offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Error al registrar Service Worker:', err);
    });
  });
}

// Variables globales de estado
let DATABASE = [];
let currentPin = '';
const PIN_LENGTH = (window.ENCRYPTED_DATA && window.ENCRYPTED_DATA.pin_length) ? window.ENCRYPTED_DATA.pin_length : 4;
const STORAGE_KEY = 'personal_xt_pin';
const ATTEMPTS_KEY = 'personal_xt_failed_attempts';
const LOCKOUT_KEY = 'personal_xt_lockout_until';
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutos de bloqueo

// Elementos DOM
const screenPin = document.getElementById('screen-pin');
const screenMain = document.getElementById('screen-main');
const screenResults = document.getElementById('screen-results');
const pinDotsContainer = document.getElementById('pin-dots');
const pinError = document.getElementById('pin-error');
const pinKeypad = document.querySelector('.pin-keypad');
const checkRemember = document.getElementById('check-remember');

// Generar dinámicamente los puntos del PIN según la longitud configurada
pinDotsContainer.innerHTML = '';
for (let i = 0; i < PIN_LENGTH; i++) {
  const dot = document.createElement('div');
  dot.className = 'pin-dot';
  pinDotsContainer.appendChild(dot);
}
const pinDots = document.querySelectorAll('.pin-dot');

const inputRubrica = document.getElementById('input-rubrica');
const selectContrato = document.getElementById('select-contrato');
const inputNombre = document.getElementById('input-nombre');
const inputNivel = document.getElementById('input-nivel');
const inputCentro = document.getElementById('input-centro');
const inputCategoria = document.getElementById('input-categoria');

const antDia = document.getElementById('ant-dia');
const antMes = document.getElementById('ant-mes');
const antAnio = document.getElementById('ant-anio');

const antcatDia = document.getElementById('antcat-dia');
const antcatMes = document.getElementById('antcat-mes');
const antcatAnio = document.getElementById('antcat-anio');

const nacDia = document.getElementById('nac-dia');
const nacMes = document.getElementById('nac-mes');
const nacAnio = document.getElementById('nac-anio');

const btnBuscar = document.getElementById('btn-buscar');
const btnBackResults = document.getElementById('btn-back-results');
const resultsTitle = document.getElementById('results-title');
const resultsContainer = document.getElementById('results-container');

const modalInfo = document.getElementById('modal-info');
const btnOpenInfo = document.getElementById('btn-open-info');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnLockApp = document.getElementById('btn-lock-app');
const infoTotal = document.getElementById('info-total');
const infoFecha = document.getElementById('info-fecha');

// Función de navegación entre pantallas
function showScreen(screen) {
  [screenPin, screenMain, screenResults].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ============================================================
// CRIPTOGRAFÍA: Web Crypto API (PBKDF2 + AES-256-GCM)
// ============================================================
function base64ToBytes(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decryptPayload(pin) {
  if (!window.ENCRYPTED_DATA) {
    throw new Error('No se encontraron los datos cifrados.');
  }

  const salt = base64ToBytes(window.ENCRYPTED_DATA.salt);
  const iv = base64ToBytes(window.ENCRYPTED_DATA.iv);
  const ciphertext = base64ToBytes(window.ENCRYPTED_DATA.ciphertext);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);
  return JSON.parse(jsonStr);
}

// ============================================================
// SISTEMA DE SEGURIDAD Y BLOQUEO TRAS 3 FALLOS
// ============================================================
let lockoutInterval = null;

function checkActiveLockout() {
  const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
  const now = Date.now();
  if (now < lockoutUntil) {
    startLockoutCountdown(lockoutUntil);
    return true;
  } else if (lockoutUntil > 0) {
    // Expiró el bloqueo anterior
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
  }
  return false;
}

function startLockoutCountdown(lockoutUntil) {
  if (lockoutInterval) clearInterval(lockoutInterval);
  pinKeypad.classList.add('locked');

  function update() {
    const remainingMs = lockoutUntil - Date.now();
    if (remainingMs <= 0) {
      clearInterval(lockoutInterval);
      lockoutInterval = null;
      pinKeypad.classList.remove('locked');
      localStorage.removeItem(LOCKOUT_KEY);
      localStorage.removeItem(ATTEMPTS_KEY);
      pinError.textContent = '';
      currentPin = '';
      updatePinDots();
      return;
    }
    const totalSecs = Math.ceil(remainingMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    pinError.textContent = `App bloqueada tras 3 fallos. Espera ${mins}:${secs}`;
  }

  update();
  lockoutInterval = setInterval(update, 1000);
}

// Intentar desbloquear la aplicación
async function attemptUnlock(pin, isAuto = false) {
  if (checkActiveLockout()) return;

  try {
    pinError.textContent = 'Descifrando...';
    const payload = await decryptPayload(pin);
    DATABASE = payload.data || [];
    
    // Éxito: limpiar intentos y bloqueos
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);

    // Guardar PIN si se marcó recordar
    if (checkRemember.checked) {
      localStorage.setItem(STORAGE_KEY, pin);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }

    infoTotal.textContent = DATABASE.length;
    infoFecha.textContent = payload.fecha || window.ENCRYPTED_DATA.actualizado || 'Reciente';

    pinError.textContent = '';
    currentPin = '';
    updatePinDots();
    showScreen(screenMain);
  } catch (err) {
    console.error('Error de descifrado:', err);
    currentPin = '';
    updatePinDots();

    if (isAuto) {
      localStorage.removeItem(STORAGE_KEY);
      showScreen(screenPin);
      return;
    }

    // Incrementar intentos fallidos
    let attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString());
      localStorage.removeItem(ATTEMPTS_KEY);
      startLockoutCountdown(lockoutUntil);
    } else {
      localStorage.setItem(ATTEMPTS_KEY, attempts.toString());
      const remaining = MAX_ATTEMPTS - attempts;
      pinError.textContent = `PIN incorrecto. Te queda${remaining === 1 ? '' : 'n'} ${remaining} intento${remaining === 1 ? '' : 's'}.`;
    }
  }
}

// ============================================================
// TECLADO NUMÉRICO Y CONTROL DEL PIN
// ============================================================
function updatePinDots() {
  pinDots.forEach((dot, index) => {
    if (index < currentPin.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });
}

document.querySelectorAll('.pin-key[data-num]').forEach(button => {
  button.addEventListener('click', () => {
    if (checkActiveLockout()) return;
    if (currentPin.length < PIN_LENGTH) {
      currentPin += button.getAttribute('data-num');
      updatePinDots();
      pinError.textContent = '';
      if (currentPin.length === PIN_LENGTH) {
        setTimeout(() => attemptUnlock(currentPin), 50);
      }
    }
  });
});

document.getElementById('btn-pin-backspace').addEventListener('click', () => {
  if (checkActiveLockout()) return;
  if (currentPin.length > 0) {
    currentPin = currentPin.slice(0, -1);
    updatePinDots();
    pinError.textContent = '';
  }
});

document.getElementById('btn-pin-clear').addEventListener('click', () => {
  if (checkActiveLockout()) return;
  currentPin = '';
  updatePinDots();
  pinError.textContent = '';
});

// Comprobar inicio
if (!checkActiveLockout()) {
  const savedPin = localStorage.getItem(STORAGE_KEY);
  if (savedPin) {
    attemptUnlock(savedPin, true);
  } else {
    showScreen(screenPin);
  }
} else {
  showScreen(screenPin);
}

// ============================================================
// LÓGICA DE PRIORIDAD DE RÚBRICA (DESHABILITAR CAMPOS)
// ============================================================
const otherFieldContainers = document.querySelectorAll('.other-field');
const overlays = document.querySelectorAll('.disabled-click-overlay');

function updateRubricaPriority() {
  const isRubricaActive = inputRubrica.value.trim().length > 0;

  otherFieldContainers.forEach(container => {
    if (isRubricaActive) {
      container.classList.add('disabled-by-rubrica');
    } else {
      container.classList.remove('disabled-by-rubrica');
    }
  });

  overlays.forEach(overlay => {
    overlay.style.display = isRubricaActive ? 'block' : 'none';
  });
}

inputRubrica.addEventListener('input', () => {
  // Solo dígitos, máximo 4
  inputRubrica.value = inputRubrica.value.replace(/\D/g, '').slice(0, 4);
  updateRubricaPriority();
});

// Al pulsar sobre cualquier campo deshabilitado, se borra Rúbrica y se activa
overlays.forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
    inputRubrica.value = '';
    updateRubricaPriority();
    const parent = overlay.parentElement;
    const inputInside = parent.querySelector('input, select');
    if (inputInside) inputInside.focus();
  });
});

// Normalización de texto (idéntica a TextUtil en Android)
function normalizeText(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// MOTOR DE BÚSQUEDA INTELIGENTE CON TOKENS (AND)
// ============================================================
function executeSearch() {
  const rubricaVal = inputRubrica.value.trim();

  // Prioridad Rúbrica: Si hay rúbrica introducida, busca por ella
  if (rubricaVal.length > 0) {
    const rubricaInt = parseInt(rubricaVal, 10);
    const results = DATABASE.filter(e => e.r === rubricaInt);
    renderResults(results);
    showScreen(screenResults);
    return;
  }

  const nombreNorm = normalizeText(inputNombre.value);
  const nombreTokens = nombreNorm ? nombreNorm.split(' ').filter(Boolean) : [];

  const nivelNorm = normalizeText(inputNivel.value);

  const centroNorm = normalizeText(inputCentro.value);
  const centroTokens = centroNorm ? centroNorm.split(' ').filter(Boolean) : [];

  const categoriaNorm = normalizeText(inputCategoria.value);
  const categoriaTokens = categoriaNorm ? categoriaNorm.split(' ').filter(Boolean) : [];

  const contratoVal = selectContrato.value; // "Todos", "Indefinido", "Temporal"
  const tipoTarget = contratoVal === 'Indefinido' ? 'I' : (contratoVal === 'Temporal' ? 'T' : null);

  const aAnio = antAnio.value.trim();
  const aMes = antMes.value.trim().padStart(2, '0');
  const aDia = antDia.value.trim().padStart(2, '0');

  const acAnio = antcatAnio.value.trim();
  const acMes = antcatMes.value.trim().padStart(2, '0');
  const acDia = antcatDia.value.trim().padStart(2, '0');

  const nAnio = nacAnio.value.trim();
  const nMes = nacMes.value.trim().padStart(2, '0');
  const nDia = nacDia.value.trim().padStart(2, '0');

  const filtered = DATABASE.filter(item => {
    // 1. Tipo de Contrato
    if (tipoTarget && item.tc !== tipoTarget) return false;

    // 2. Nombre (Tokens AND)
    if (nombreTokens.length > 0) {
      for (const token of nombreTokens) {
        if (!item.nb.includes(token)) return false;
      }
    }

    // 3. Nivel
    if (nivelNorm.length > 0) {
      if (!item.nvb.includes(nivelNorm)) return false;
    }

    // 4. Centro de Coste (Tokens AND sobre código o nombre)
    if (centroTokens.length > 0) {
      for (const token of centroTokens) {
        const matchCode = item.cc.includes(token);
        const matchName = item.ncb.includes(token);
        if (!matchCode && !matchName) return false;
      }
    }

    // 5. Categoría (Tokens AND)
    if (categoriaTokens.length > 0) {
      for (const token of categoriaTokens) {
        if (!item.nctb.includes(token)) return false;
      }
    }

    // 6. Fechas: Antigüedad
    if (aAnio && (!item.a || !item.a.startsWith(aAnio))) return false;
    if (antMes.value.trim() && (!item.a || !item.a.includes(`-${aMes}-`))) return false;
    if (antDia.value.trim() && (!item.a || !item.a.endsWith(`-${aDia}`))) return false;

    // 7. Fechas: Antigüedad Categoría
    if (acAnio && (!item.ac || !item.ac.startsWith(acAnio))) return false;
    if (antcatMes.value.trim() && (!item.ac || !item.ac.includes(`-${acMes}-`))) return false;
    if (antcatDia.value.trim() && (!item.ac || !item.ac.endsWith(`-${acDia}`))) return false;

    // 8. Fechas: Nacimiento
    if (nAnio && (!item.fn || !item.fn.startsWith(nAnio))) return false;
    if (nacMes.value.trim() && (!item.fn || !item.fn.includes(`-${nMes}-`))) return false;
    if (nacDia.value.trim() && (!item.fn || !item.fn.endsWith(`-${nDia}`))) return false;

    return true;
  });

  renderResults(filtered);
  showScreen(screenResults);
}

// Formateo de fecha YYYY-MM-DD a DD/MM/AAAA
function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Renderizado de las tarjetas de resultados
function renderResults(results) {
  resultsTitle.textContent = `Resultados (${results.length})`;
  resultsContainer.innerHTML = '';

  if (results.length === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <div>No se encontraron resultados</div>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  results.forEach(emp => {
    const card = document.createElement('div');
    card.className = 'card-empleado';

    const isTemporal = emp.tc === 'T';
    const badgeClass = isTemporal ? 'temporal' : 'indefinido';
    const badgeText = isTemporal ? 'T' : 'I';

    const hasDates = emp.a || emp.ac || emp.fn;

    card.innerHTML = `
      <div class="card-header">
        <span class="card-rubrica">Rúbrica: ${emp.r}</span>
        <div class="card-badge ${badgeClass}">${badgeText}</div>
        <span class="card-nivel">Nivel: ${emp.nv || '--'}</span>
      </div>
      <div class="card-nombre">${emp.n}</div>
      ${emp.nct ? `<div class="card-categoria">${emp.nct}</div>` : ''}
      <div class="card-centro"><strong>Centro: </strong>${emp.nc || 'No asignado'} (${emp.cc})</div>
      ${hasDates ? `
        <div class="card-divider"></div>
        <div class="card-dates-row">
          ${emp.a ? `<span class="date-badge-text date-ant">Ant.: <strong>${formatDate(emp.a)}</strong></span>` : ''}
          ${emp.ac ? `<span class="date-badge-text date-ant-cat">A.Cat.: <strong>${formatDate(emp.ac)}</strong></span>` : ''}
          ${emp.fn ? `<span class="date-badge-text date-nac">Nac.: <strong>${formatDate(emp.fn)}</strong></span>` : ''}
        </div>
      ` : ''}
    `;

    fragment.appendChild(card);
  });

  resultsContainer.appendChild(fragment);
  resultsContainer.scrollTop = 0;
}

// Event Listeners de Búsqueda y Navegación
btnBuscar.addEventListener('click', executeSearch);

// Soporte para tecla Enter en los campos de texto
[inputRubrica, inputNombre, inputNivel, inputCentro, inputCategoria, antDia, antMes, antAnio, antcatDia, antcatMes, antcatAnio, nacDia, nacMes, nacAnio].forEach(input => {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
      executeSearch();
    }
  });
});

btnBackResults.addEventListener('click', () => {
  showScreen(screenMain);
});

// Modal y bloqueo
btnOpenInfo.addEventListener('click', () => {
  modalInfo.classList.add('active');
});

btnCloseModal.addEventListener('click', () => {
  modalInfo.classList.remove('active');
});

btnLockApp.addEventListener('click', () => {
  modalInfo.classList.remove('active');
  localStorage.removeItem(STORAGE_KEY);
  DATABASE = [];
  currentPin = '';
  updatePinDots();
  showScreen(screenPin);
});
