/* ============================================
   APTUS — Application Importer (Level 1)
   CSV / Excel → Candidate Records
   ============================================ */

/* ---- State ---- */
let importState = {
  currentStep: 1,
  selectedFormat: null,
  rawRows: [],
  headers: [],
  mapping: {},
  mappedCandidates: [],
  duplicates: [],
};

/* ---- Standard Aptus Fields ---- */
const APTUS_FIELDS = [
  { value: 'fullName',          label: 'Candidate Name' },
  { value: 'email',             label: 'Email' },
  { value: 'phone',             label: 'Phone' },
  { value: 'cvUrl',             label: 'Resume / CV Link' },
  { value: 'yearsOfExperience', label: 'Years of Experience' },
  { value: 'location',          label: 'Location' },
  { value: 'qualifications',    label: 'Education / Qualifications' },
  { value: 'linkedIn',          label: 'LinkedIn' },
  { value: 'achievements',      label: 'Cover Letter / Summary' },
  { value: 'currentRole',       label: 'Current Role / Title' },
  { value: 'skills',            label: 'Skills' },
  { value: 'ignore',            label: '— Ignore this column —' },
  { value: 'custom',            label: '★ Keep as Custom Field' },
];

/* ---- Intelligent Keyword Mapping ---- */
const FIELD_KEYWORDS = {
  fullName:          ['name','full name','fullname','applicant name','candidate','your name','first and last'],
  email:             ['email','e-mail','email address','mail'],
  phone:             ['phone','mobile','phone number','tel','telephone','contact number','mobile number'],
  cvUrl:             ['cv','resume','cv link','resume link','upload cv','upload resume','attach cv','attach resume','curriculum','file upload','your cv'],
  yearsOfExperience: ['experience','years','years of experience','yrs','year of exp','work experience'],
  location:          ['location','state','city','address','where do you','current location','residence'],
  qualifications:    ['education','qualification','degree','study','school','university','institution','highest qual'],
  linkedIn:          ['linkedin','linked in','linkedin url','linkedin profile','profile url'],
  achievements:      ['cover letter','why','motivation','reason','interests','summary','statement','tell us'],
  currentRole:       ['current role','job title','current position','position','role','title','designation'],
  skills:            ['skills','skill','competencies','technologies','tools','tech stack'],
};

function suggestMapping(headerText) {
  const lower = headerText.toLowerCase().trim();
  for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return field;
    }
  }
  return 'custom';
}

/* ---- CSV Parser ---- */
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const result = [];
    let inQuote = false, current = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuote = !inQuote; }
      } else if (ch === ',' && !inQuote) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return { headers, rows };
}

/* ---- Excel Parser (SheetJS) ---- */
function parseExcel(buffer) {
  if (typeof XLSX === 'undefined') throw new Error('SheetJS library not loaded');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (jsonRows.length < 2) return { headers: [], rows: [] };
  const headers = jsonRows[0].map(h => String(h).trim());
  const rows = [];
  for (let i = 1; i < jsonRows.length; i++) {
    const row = {};
    headers.forEach((h, idx) => { row[h] = String(jsonRows[i][idx] || '').trim(); });
    if (Object.values(row).some(v => v)) rows.push(row);
  }
  return { headers, rows };
}

/* ============================================
   UI Functions
   ============================================ */

function openImportModal() {
  importState = {
    currentStep: 1,
    selectedFormat: null,
    rawRows: [],
    headers: [],
    mapping: {},
    mappedCandidates: [],
    duplicates: [],
  };
  showImportStep(1);
  document.getElementById('importFileInput').value = '';
  document.getElementById('importDropzone').style.display = 'none';
  ['CSV','XLSX'].forEach(f => {
    const card = document.getElementById('formatCard' + f);
    if (card) { card.style.borderColor = 'var(--border)'; card.style.background = ''; }
  });
  document.getElementById('importModal').classList.remove('hidden');
}

function showImportStep(step) {
  importState.currentStep = step;
  document.getElementById('importStep1').style.display = step === 1 ? 'block' : 'none';
  document.getElementById('importStep2').style.display = step === 2 ? 'block' : 'none';
  document.getElementById('importStep3').style.display = step === 3 ? 'block' : 'none';
  document.getElementById('importBtnBack').style.display = step > 1 ? 'inline-flex' : 'none';
  document.getElementById('importBtnNext').style.display = step < 3 ? 'inline-flex' : 'none';
  document.getElementById('importBtnConfirm').style.display = step === 3 ? 'inline-flex' : 'none';
  const titles = { 1: '📥 Import Applications', 2: '🔀 Map Your Fields', 3: '✅ Import Preview' };
  document.getElementById('importModalTitle').textContent = titles[step] || '';
}

function selectImportFormat(format) {
  importState.selectedFormat = format;
  ['CSV','XLSX'].forEach(f => {
    const card = document.getElementById('formatCard' + f);
    if (!card) return;
    const sel = (f === 'CSV' && format === 'csv') || (f === 'XLSX' && format === 'xlsx');
    card.style.borderColor = sel ? 'var(--primary-blue)' : 'var(--border)';
    card.style.background = sel ? '#f0f5ff' : '';
  });
  const fileInput = document.getElementById('importFileInput');
  if (format === 'csv') {
    fileInput.accept = '.csv,text/csv';
    document.getElementById('importDropzoneText').textContent = 'Drag & drop your CSV file here';
    document.getElementById('importDropzoneHint').textContent = 'Accepts .csv (exported from Google Forms or any form tool)';
  } else {
    fileInput.accept = '.xlsx,.xls';
    document.getElementById('importDropzoneText').textContent = 'Drag & drop your Excel file here';
    document.getElementById('importDropzoneHint').textContent = 'Accepts .xlsx or .xls files';
  }
  document.getElementById('importDropzone').style.display = 'block';
}

function handleImportDrop(event) {
  const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
  if (file) processImportFile(file);
}

function handleImportFileSelected(event) {
  const file = event.target.files[0];
  if (file) processImportFile(file);
}

function processImportFile(file) {
  const dropzone = document.getElementById('importDropzone');
  dropzone.innerHTML = '<div style="font-size:28px; margin-bottom:10px;">⏳</div><p style="font-weight:600; color:var(--charcoal);">Reading file…</p>';

  const isCSV = file.name.toLowerCase().endsWith('.csv');
  const reader = new FileReader();

  if (isCSV || importState.selectedFormat === 'csv') {
    importState.selectedFormat = 'csv';
    reader.onload = function(e) {
      try {
        const result = parseCSV(e.target.result);
        if (!result.headers || result.headers.length === 0) {
          showToast('Could not read headers from this file.', 'danger', '❌');
          return;
        }
        importState.headers = result.headers;
        importState.rawRows = result.rows;
        buildMappingUI();
        showImportStep(2);
      } catch (err) {
        showToast('Failed to parse CSV: ' + err.message, 'danger', '❌');
      }
    };
    reader.readAsText(file);
  } else {
    importState.selectedFormat = 'xlsx';
    reader.onload = function(e) {
      try {
        const result = parseExcel(new Uint8Array(e.target.result));
        if (!result.headers || result.headers.length === 0) {
          showToast('Could not read headers from this file.', 'danger', '❌');
          return;
        }
        importState.headers = result.headers;
        importState.rawRows = result.rows;
        buildMappingUI();
        showImportStep(2);
      } catch (err) {
        showToast('Failed to parse Excel file: ' + err.message, 'danger', '❌');
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

function buildMappingUI() {
  const container = document.getElementById('importMappingRows');
  container.innerHTML = '';
  importState.headers.forEach(function(header) {
    const suggested = suggestMapping(header);
    importState.mapping[header] = suggested;

    const optionsHTML = APTUS_FIELDS.map(function(f) {
      return '<option value="' + f.value + '"' + (f.value === suggested ? ' selected' : '') + '>' + f.label + '</option>';
    }).join('');

    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; gap:12px; background:var(--bg-light); border-radius:10px; padding:12px 14px;';
    const safeHeader = header.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    row.innerHTML =
      '<div style="flex:1; font-size:13px; font-weight:600; color:var(--charcoal); word-break:break-word;">' + header + '</div>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--text-mid);flex-shrink:0;"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
      '<select style="flex:1; padding:8px 10px; border:1px solid var(--border); border-radius:8px; font-family:Inter,sans-serif; font-size:13px; background:white;" ' +
      'onchange="importState.mapping[\'' + safeHeader + '\'] = this.value">' +
      optionsHTML + '</select>';
    container.appendChild(row);
  });
}

function importGoNext() {
  if (importState.currentStep === 2) processFieldMapping();
}

function importGoBack() {
  if (importState.currentStep === 2) {
    showImportStep(1);
    selectImportFormat(importState.selectedFormat || 'csv');
  } else if (importState.currentStep === 3) {
    showImportStep(2);
  }
}

function processFieldMapping() {
  const mapping = importState.mapping;
  const rows = importState.rawRows;
  const candidates = [];
  const seenEmails = {};
  const seenPhones = {};
  const duplicates = [];

  rows.forEach(function(row, idx) {
    const c = {
      fullName: '', email: '', phone: null, linkedIn: null, cvUrl: null,
      yearsOfExperience: 0, qualifications: null, achievements: null,
      currentRole: null, skills: [], customFields: {},
    };

    Object.keys(mapping).forEach(function(header) {
      const aptusField = mapping[header];
      const val = (row[header] || '').trim();
      if (!val || aptusField === 'ignore') return;

      if (aptusField === 'custom') {
        c.customFields[header] = val;
      } else if (aptusField === 'yearsOfExperience') {
        const num = parseFloat(val.replace(/[^0-9.]/g, ''));
        c.yearsOfExperience = isNaN(num) ? 0 : num;
      } else if (aptusField === 'skills') {
        c.skills = val.split(/[,;]/).map(function(s) { return s.trim(); }).filter(Boolean);
      } else if (aptusField === 'location') {
        c.customFields['location'] = val;
      } else {
        c[aptusField] = val;
      }
    });

    const emailKey = c.email ? c.email.toLowerCase() : null;
    const phoneKey = c.phone ? c.phone.replace(/\s/g, '') : null;
    const isDupEmail = emailKey && seenEmails[emailKey];
    const isDupPhone = phoneKey && seenPhones[phoneKey];

    if (isDupEmail || isDupPhone) {
      duplicates.push({ idx: idx + 2, name: c.fullName, email: c.email });
    } else {
      if (emailKey) seenEmails[emailKey] = true;
      if (phoneKey) seenPhones[phoneKey] = true;
      candidates.push(c);
    }
  });

  importState.mappedCandidates = candidates;
  importState.duplicates = duplicates;
  buildPreviewUI();
  showImportStep(3);
}

function buildPreviewUI() {
  const candidates = importState.mappedCandidates;
  const duplicates = importState.duplicates;
  const withEmail = candidates.filter(function(c) { return c.email; }).length;
  const withCV = candidates.filter(function(c) { return c.cvUrl; }).length;
  const withoutCV = candidates.length - withCV;

  const container = document.getElementById('importPreviewContent');
  let dupHtml = '';
  if (duplicates.length > 0) {
    const dupRows = duplicates.map(function(d) {
      return '<div style="font-size:12px;color:#78350f;">Row ' + d.idx + ': <strong>' + (d.name || 'Unknown') + '</strong>' + (d.email ? ' — ' + d.email : '') + '</div>';
    }).join('');
    dupHtml = '<div style="background:#fff8ed;border:1px solid #fcd34d;border-radius:10px;padding:14px 16px;margin-bottom:16px;">' +
      '<p style="font-size:13px;font-weight:600;color:#92400e;margin-bottom:8px;">⚠️ ' + duplicates.length + ' duplicate' + (duplicates.length > 1 ? 's' : '') + ' detected (same email or phone)</p>' +
      '<div style="max-height:120px;overflow-y:auto;">' + dupRows + '</div>' +
      '<p style="font-size:12px;color:var(--text-mid);margin-top:8px;">These rows were excluded. Only unique candidates will be imported.</p>' +
      '</div>';
  }

  container.innerHTML =
    '<div style="text-align:center; margin-bottom:24px;">' +
      '<div style="width:64px;height:64px;background:linear-gradient(135deg,#e8f0fe,#c7d7fc);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:28px;">📋</div>' +
      '<h3 style="font-size:20px;font-weight:800;color:var(--charcoal);margin-bottom:4px;">Import Preview</h3>' +
      '<p style="color:var(--text-mid);font-size:14px;">' + (candidates.length + duplicates.length) + ' applications detected in file</p>' +
    '</div>' +
    '<div style="background:var(--bg-light);border-radius:12px;padding:20px;margin-bottom:20px;display:flex;flex-direction:column;gap:10px;">' +
      '<div style="display:flex;align-items:center;gap:10px;font-size:14px;"><span style="font-size:18px;">✅</span><span><strong>' + candidates.length + '</strong> candidates to be imported</span></div>' +
      '<div style="display:flex;align-items:center;gap:10px;font-size:14px;"><span style="font-size:18px;">📧</span><span><strong>' + withEmail + '</strong> email addresses found</span></div>' +
      '<div style="display:flex;align-items:center;gap:10px;font-size:14px;"><span style="font-size:18px;">' + (withCV > 0 ? '📎' : '⚠️') + '</span><span><strong>' + withCV + '</strong> CV / resume references' + (withoutCV > 0 ? ' · <em style="color:var(--text-mid);">' + withoutCV + ' without CV</em>' : '') + '</span></div>' +
      (duplicates.length > 0 ? '<div style="display:flex;align-items:center;gap:10px;font-size:14px;color:#b45309;"><span style="font-size:18px;">⚠️</span><span><strong>' + duplicates.length + '</strong> duplicate' + (duplicates.length > 1 ? 's' : '') + ' skipped</span></div>' : '') +
    '</div>' +
    dupHtml +
    '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;">' +
      '<p style="font-size:13px;font-weight:600;color:#166534;margin-bottom:4px;">✅ Ready to import</p>' +
      '<p style="font-size:12px;color:var(--text-mid);">After import, candidates will appear in the Rankings table and you can rank, shortlist, reject, and view their profiles normally.</p>' +
    '</div>';
}

async function finalizeImport() {
  const jobId = window.currentJobId;
  if (!jobId) { showToast('No job selected for import', 'danger', '❌'); return; }
  const candidates = importState.mappedCandidates;
  if (!candidates.length) { showToast('No candidates to import', 'warning', '⚠️'); return; }

  const btn = document.getElementById('importBtnConfirm');
  btn.disabled = true;
  btn.textContent = 'Importing…';

  try {
    const res = await fetch('/api/jobs/' + jobId + '/candidates/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates: candidates }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Import failed');

    closeModal('importModal');
    showToast('✅ ' + data.count + ' candidate' + (data.count !== 1 ? 's' : '') + ' imported successfully!', 'success', '📥');

    if (typeof renderRankings === 'function') {
      await renderRankings(jobId, false);
    }
  } catch (err) {
    showToast('Import failed: ' + err.message, 'danger', '❌');
  } finally {
    btn.disabled = false;
    btn.textContent = '📥 Import All Candidates';
  }
}
