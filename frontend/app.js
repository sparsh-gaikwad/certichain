/* =====================================================
   CERTICHAIN — app.js  (Backend-connected version)
   ===================================================== */

'use strict';

// ── CONFIG ────────────────────────────────────────────────
const API = 'http://localhost:8000/api/certificates'; // change to your deployed URL

// ── STATE ─────────────────────────────────────────────────
let blockchain = [];
let verificationCount = 0;
let currentCert = null;

// ── BOOTSTRAP ─────────────────────────────────────────────
(async function init() {
  await loadCertificates();
  updateStats();
})();

// ── FETCH ALL CERTS FROM BACKEND ──────────────────────────
async function loadCertificates() {
  try {
    const res = await fetch(`${API}/`);
    blockchain = await res.json();

    // Also pull stats
    const statsRes = await fetch(`${API}/stats/summary`);
    const stats = await statsRes.json();
    animateNum('stat-total',        stats.total);
    animateNum('stat-universities', stats.universities);
    animateNum('stat-revoked',      stats.revoked);
  } catch (e) {
    toast('Could not reach backend. Is the server running?', 'error');
  }
}

// ============================================================
// CRYPTO — Real SHA-256 via Web Crypto API
// ============================================================
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// UTILITIES
// ============================================================
function genCertId() {
  return 'CERT-' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function genBlockNum() {
  return 18_000_000 + Math.floor(Math.random() * 1_000_000);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// TABS
// ============================================================
function showTab(tab) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const tabEl = document.getElementById('tab-' + tab);
  if (tabEl) tabEl.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    const text = btn.textContent.toLowerCase();
    const match =
      (tab === 'issue'  && text.includes('issue'))  ||
      (tab === 'verify' && text.includes('verify')) ||
      (tab === 'ledger' && text.includes('ledger')) ||
      (tab === 'portal' && text.includes('university'));
    btn.classList.toggle('active', match);
  });

  if (tab === 'ledger') renderLedger();
  if (tab === 'portal') renderPortal();
}

// ============================================================
// TOAST
// ============================================================
function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3700);
}

// ============================================================
// MODALS
// ============================================================
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show');
});

// ============================================================
// ISSUE CERTIFICATE  ← now POSTs to backend
// ============================================================
async function issueCertificate() {
  const name   = document.getElementById('f-name').value.trim();
  const sid    = document.getElementById('f-sid').value.trim();
  const degree = document.getElementById('f-degree').value.trim();
  const uni    = document.getElementById('f-university').value;
  const year   = document.getElementById('f-year').value;
  const gpa    = document.getElementById('f-gpa').value.trim();
  const notes  = document.getElementById('f-notes').value.trim();

  if (!name || !sid || !degree || !uni || !year) {
    toast('Please fill all required fields.', 'error');
    return;
  }

  const progress = document.getElementById('tx-progress');
  const result   = document.getElementById('cert-result');
  progress.classList.add('show');
  result.classList.remove('show');

  const stepIds = ['step1','step2','step3','step4','step5','step6'];
  for (let i = 0; i < stepIds.length; i++) {
    await delay(600);
    const stepEl = document.getElementById(stepIds[i]);
    stepEl.className = 'tx-step active';
    stepEl.querySelector('.step-indicator').textContent = i < 5 ? '⟳' : '✓';
    if (i > 0) {
      const prev = document.getElementById(stepIds[i - 1]);
      prev.className = 'tx-step done';
      prev.querySelector('.step-indicator').textContent = '✓';
    }
  }
  await delay(400);
  document.getElementById('step6').className = 'tx-step done';

  const certId    = genCertId();
  const blockNum  = genBlockNum();
  const timestamp = new Date().toISOString();
  const hash      = await sha256(`${certId}|${name}|${sid}|${degree}|${uni}|${year}|${gpa}|${timestamp}`);

  // ── POST to backend ──
  try {
    const res = await fetch(`${API}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cert_id: certId, name, sid, degree, uni, year: parseInt(year), gpa, notes, hash, block_num: blockNum })
    });

    if (!res.ok) {
      const err = await res.json();
      toast(err.detail || 'Error saving certificate.', 'error');
      return;
    }

    const cert = await res.json();
    currentCert = { ...cert, certId: cert.cert_id, blockNum: cert.block_num, timestamp: cert.issued_at };
    blockchain.unshift(cert);
    updateStats();

    document.getElementById('r-name').textContent   = name;
    document.getElementById('r-degree').textContent = degree;
    document.getElementById('r-uni').textContent    = uni;
    document.getElementById('r-year').textContent   = year;
    document.getElementById('r-gpa').textContent    = gpa || 'N/A';
    document.getElementById('r-cid').textContent    = cert.cert_id;
    document.getElementById('r-block').textContent  = '#' + cert.block_num.toLocaleString();
    document.getElementById('r-time').textContent   = new Date(cert.issued_at).toLocaleDateString();
    document.getElementById('r-hash').textContent   = cert.hash;

    result.classList.add('show');
    toast(`Certificate minted! Block #${cert.block_num.toLocaleString()}`, 'success');
  } catch {
    toast('Network error. Is the backend running?', 'error');
  }
}

// ============================================================
// CLEAR FORM
// ============================================================
function clearForm() {
  ['f-name','f-sid','f-degree','f-year','f-gpa','f-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('f-university').value = '';
  document.getElementById('tx-progress').classList.remove('show');
  document.getElementById('cert-result').classList.remove('show');
  for (let i = 1; i <= 6; i++) {
    const step = document.getElementById('step' + i);
    if (step) {
      step.className = 'tx-step';
      step.querySelector('.step-indicator').textContent = String(i);
    }
  }
}

// ============================================================
// VERIFY CERTIFICATE  ← now hits backend
// ============================================================
async function verifyCertificate() {
  const input = document.getElementById('v-input').value.trim();
  if (!input) { toast('Enter a Certificate ID or hash.', 'error'); return; }

  verificationCount++;
  animateNum('stat-verified', verificationCount);

  const resultEl = document.getElementById('verify-result');
  resultEl.classList.remove('valid', 'invalid', 'show');

  try {
    const res  = await fetch(`${API}/verify/${encodeURIComponent(input)}`);
    const data = await res.json();

    if (!data.found) {
      resultEl.classList.add('invalid', 'show');
      document.getElementById('v-icon').textContent  = '❌';
      document.getElementById('v-title').innerHTML   = '<span class="invalid-txt">Not Found on Blockchain</span>';
      document.getElementById('v-subtitle').textContent = 'No matching certificate found. This may be fraudulent.';
      document.getElementById('v-details').innerHTML = `<div class="vd-item"><label>Query</label><span style="font-family:'Space Mono',monospace;font-size:0.75rem;">${input}</span></div>`;
      toast('Certificate not found on blockchain', 'error');
      return;
    }

    const cert = data.cert;
    if (cert.status === 'revoked') {
      resultEl.classList.add('invalid', 'show');
      document.getElementById('v-icon').textContent  = '🚫';
      document.getElementById('v-title').innerHTML   = '<span class="invalid-txt">Certificate Revoked</span>';
      document.getElementById('v-subtitle').textContent = 'This certificate has been revoked by the issuing university.';
      document.getElementById('v-details').innerHTML = `<div class="vd-item"><label>Student</label><span>${cert.name}</span></div><div class="vd-item"><label>Status</label><span style="color:var(--error)">REVOKED</span></div>`;
      toast('Certificate has been revoked!', 'error');
    } else {
      resultEl.classList.add('valid', 'show');
      document.getElementById('v-icon').textContent  = '✅';
      document.getElementById('v-title').innerHTML   = '<span class="valid-txt">Certificate Verified</span>';
      document.getElementById('v-subtitle').textContent = 'This certificate exists on the blockchain and has not been tampered with.';
      document.getElementById('v-details').innerHTML = `
        <div class="vd-item"><label>Student</label><span>${cert.name}</span></div>
        <div class="vd-item"><label>Certificate ID</label><span>${cert.cert_id}</span></div>
        <div class="vd-item"><label>Degree</label><span>${cert.degree}</span></div>
        <div class="vd-item"><label>University</label><span>${cert.uni}</span></div>
        <div class="vd-item"><label>Year</label><span>${cert.year}</span></div>
        <div class="vd-item"><label>Block</label><span>#${cert.block_num.toLocaleString()}</span></div>
      `;
      toast('Certificate is authentic ✓', 'success');
    }
  } catch {
    toast('Network error during verification.', 'error');
  }
}

// ============================================================
// SIMULATE QR SCAN
// ============================================================
function simulateScan() {
  if (blockchain.length === 0) { toast('No certificates issued yet!', 'error'); return; }
  const cert = blockchain[Math.floor(Math.random() * blockchain.length)];
  showTab('verify');
  document.getElementById('v-input').value = cert.cert_id;
  verifyCertificate();
  toast('QR Code scanned: ' + cert.cert_id, 'info');
}

// ============================================================
// LEDGER  ← uses in-memory blockchain (already fetched)
// ============================================================
function renderLedger(filter = '') {
  const listEl      = document.getElementById('ledger-list');
  const countEl     = document.getElementById('ledger-count');
  const lowerFilter = filter.toLowerCase();

  const filtered = blockchain.filter(c =>
    !lowerFilter ||
    c.name.toLowerCase().includes(lowerFilter)    ||
    c.cert_id.toLowerCase().includes(lowerFilter) ||
    c.uni.toLowerCase().includes(lowerFilter)
  );

  countEl.textContent = filtered.length + ' Record' + (filtered.length !== 1 ? 's' : '');

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="ledger-empty"><div class="empty-icon">🔍</div><p>No matching certificates found.</p></div>`;
    return;
  }

  listEl.innerHTML = '';
  const chain = document.createElement('div');
  chain.className = 'blocks-chain';

  filtered.forEach((cert, i) => {
    const block = document.createElement('div');
    block.className = 'block-item';
    block.style.animationDelay = (i * 0.05) + 's';
    block.addEventListener('click', () => showDetail(cert));
    block.innerHTML = `
      <div class="block-top">
        <span class="block-id">Block #${cert.block_num.toLocaleString()} · ${cert.cert_id}</span>
        <span class="block-badge ${cert.status === 'revoked' ? 'badge-revoked' : 'badge-verified'}">${cert.status}</span>
      </div>
      <div class="block-student">${cert.name}</div>
      <div class="block-meta">${cert.degree} · ${cert.uni} · ${cert.year}</div>
      <div class="block-hash-preview">${cert.hash.substring(0, 64)}...</div>
    `;
    chain.appendChild(block);
    if (i < filtered.length - 1) {
      const conn = document.createElement('div');
      conn.className = 'chain-connector';
      chain.appendChild(conn);
    }
  });

  listEl.appendChild(chain);
}

function filterLedger() {
  renderLedger(document.getElementById('ledger-search').value);
}

function exportLedger() {
  const blob = new Blob([JSON.stringify(blockchain, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'certichain-ledger.json'; a.click();
  URL.revokeObjectURL(url);
  toast('Ledger exported as JSON!', 'success');
}

// ============================================================
// DETAIL MODAL
// ============================================================
function showDetail(cert) {
  const statusColor  = cert.status === 'revoked' ? 'var(--error)' : 'var(--success)';
  const notesSection = cert.notes
    ? `<div style="margin-top:12px;padding:12px;background:var(--surface2);border-radius:8px;">
         <div class="detail-hash-label">Notes</div>
         <p style="margin-top:4px;font-size:0.88rem;">${cert.notes}</p>
       </div>` : '';

  document.getElementById('detail-content').innerHTML = `
    <h2 style="margin-bottom:4px;">${cert.name}</h2>
    <p style="color:var(--accent);font-size:0.9rem;margin-bottom:20px;">${cert.cert_id}</p>
    <div class="detail-grid">
      <div class="detail-field"><label>Degree</label>     <p>${cert.degree}</p></div>
      <div class="detail-field"><label>University</label> <p>${cert.uni}</p></div>
      <div class="detail-field"><label>Year</label>       <p>${cert.year}</p></div>
      <div class="detail-field"><label>GPA</label>        <p>${cert.gpa || 'N/A'}</p></div>
      <div class="detail-field"><label>Status</label>     <p style="color:${statusColor};">${cert.status.toUpperCase()}</p></div>
      <div class="detail-field"><label>Block</label>      <p style="font-family:'Space Mono',monospace;">#${cert.block_num.toLocaleString()}</p></div>
    </div>
    <div class="detail-hash-box">
      <div class="detail-hash-label">SHA-256 Hash</div>
      <div class="detail-hash-value">${cert.hash}</div>
    </div>
    ${notesSection}
    <div style="margin-top:16px;font-family:'Space Mono',monospace;font-size:0.72rem;color:var(--muted);">
      Issued: ${new Date(cert.issued_at).toLocaleString()}
    </div>
  `;
  document.getElementById('detail-modal').classList.add('show');
}

// ============================================================
// UNIVERSITY PORTAL  ← uses fetched blockchain + stats API
// ============================================================
async function renderPortal() {
  try {
    const res   = await fetch(`${API}/stats/summary`);
    const stats = await res.json();
    const thisYear = blockchain.filter(c => String(c.year) === String(new Date().getFullYear())).length;

    document.getElementById('p-total').textContent     = stats.total;
    document.getElementById('p-this-year').textContent = thisYear;
    document.getElementById('p-revoked').textContent   = stats.revoked;
    document.getElementById('p-verified').textContent  = verificationCount;
  } catch {
    // silently fail
  }

  const uniMap = {};
  blockchain.forEach(c => { uniMap[c.uni] = (uniMap[c.uni] || 0) + 1; });

  const breakdown = document.getElementById('uni-breakdown');
  breakdown.innerHTML = '';
  if (Object.keys(uniMap).length === 0) {
    breakdown.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">No data yet.</p>';
    return;
  }

  const maxCount = Math.max(...Object.values(uniMap));
  Object.entries(uniMap).sort((a, b) => b[1] - a[1]).forEach(([uni, count]) => {
    const pct = ((count / maxCount) * 100).toFixed(0);
    const row = document.createElement('div');
    row.className = 'breakdown-row';
    row.innerHTML = `
      <span class="breakdown-name">${uni}</span>
      <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${pct}%"></div></div>
      <span class="breakdown-count">${count}</span>
    `;
    breakdown.appendChild(row);
  });
}

// ============================================================
// REVOKE  ← now PATCHes backend
// ============================================================
async function revokeCertificate() {
  const input = document.getElementById('revoke-input').value.trim();
  if (!input) { toast('Enter a Certificate ID to revoke.', 'error'); return; }

  try {
    const res = await fetch(`${API}/revoke`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cert_id: input })
    });

    if (!res.ok) {
      const err = await res.json();
      toast(err.detail || 'Revoke failed.', 'error');
      return;
    }

    // Update local cache
    const idx = blockchain.findIndex(c => c.cert_id === input);
    if (idx !== -1) blockchain[idx].status = 'revoked';

    renderPortal();
    toast('Certificate revoked: ' + input, 'success');
    document.getElementById('revoke-input').value = '';
  } catch {
    toast('Network error during revoke.', 'error');
  }
}

// ============================================================
// QR CODE
// ============================================================
function showQR() {
  if (!currentCert) return;
  const container = document.getElementById('qr-container');
  container.innerHTML = '';
  const verifyURL = `${window.location.href.split('?')[0]}?verify=${currentCert.certId}`;
  new QRCode(container, { text: verifyURL, width: 180, height: 180, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
  document.getElementById('qr-cert-id').textContent = currentCert.certId;
  document.getElementById('qr-modal').classList.add('show');
}

// ============================================================
// DOWNLOAD CERTIFICATE
// ============================================================
function downloadCert() {
  if (!currentCert) return;
  const content = [
    'CERTICHAIN — BLOCKCHAIN CERTIFICATE',
    '=====================================',
    `Certificate ID : ${currentCert.certId}`,
    `Student Name   : ${currentCert.name}`,
    `Student ID     : ${currentCert.sid}`,
    `Degree         : ${currentCert.degree}`,
    `University     : ${currentCert.uni}`,
    `Year           : ${currentCert.year}`,
    `GPA            : ${currentCert.gpa || 'N/A'}`,
    `Block Number   : #${currentCert.blockNum}`,
    `Issued On      : ${new Date(currentCert.timestamp).toLocaleString()}`,
    `SHA-256 Hash   : ${currentCert.hash}`,
    '=====================================',
    `Verify at: ${window.location.href.split('?')[0]}?verify=${currentCert.certId}`
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${currentCert.certId}.txt`; a.click();
  URL.revokeObjectURL(url);
  toast('Certificate downloaded!', 'success');
}

// ============================================================
// COPY HASH
// ============================================================
function copyHash() {
  if (!currentCert) return;
  navigator.clipboard.writeText(currentCert.hash)
    .then(() => toast('Hash copied to clipboard!', 'success'))
    .catch(() => toast('Failed to copy hash.', 'error'));
}

// ============================================================
// STATS
// ============================================================
function updateStats() {
  const total   = blockchain.length;
  const revoked = blockchain.filter(c => c.status === 'revoked').length;
  const unis    = [...new Set(blockchain.map(c => c.uni))].length;
  animateNum('stat-total',        total);
  animateNum('stat-universities', unis);
  animateNum('stat-revoked',      revoked);
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  const step    = Math.max(1, Math.ceil(Math.abs(target - current) / 20));
  let val = current;
  const timer = setInterval(() => {
    val = val < target ? Math.min(val + step, target) : Math.max(val - step, target);
    el.textContent = val;
    if (val === target) clearInterval(timer);
  }, 40);
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
  if (e.key === 'Enter' && document.activeElement.id === 'v-input') verifyCertificate();
  if (e.key === 'Enter' && document.activeElement.id === 'revoke-input') revokeCertificate();
});

// ============================================================
// URL PARAM — auto-verify on load
// ============================================================
const urlParams = new URLSearchParams(window.location.search);
const verifyParam = urlParams.get('verify');
if (verifyParam) {
  showTab('verify');
  document.getElementById('v-input').value = verifyParam;
  verifyCertificate();
}