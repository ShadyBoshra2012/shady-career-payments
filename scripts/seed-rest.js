const XLSX = require('xlsx');
const path = require('path');

const PROJECT_ID = 'shady-career-payments';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Convert an Excel serial number to a JS Date
function excelSerialToDate(serial) {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

// Parse dd/MM/yyyy string to Date
function parseDDMMYYYY(str) {
  const m = String(str).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
}

// Robust date parsing: Date objects, serial numbers, dd/MM/yyyy, ISO strings
function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'number') return excelSerialToDate(val);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    // Try dd/MM/yyyy first
    const ddmm = parseDDMMYYYY(trimmed);
    if (ddmm) return ddmm;
    // Fall back to JS Date constructor
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// Format a sub scope value: if it's a Date or serial number, format as "MMM yyyy"
function formatSubScope(val) {
  if (!val && val !== 0) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    return `${MONTHS[val.getMonth()]} ${val.getFullYear()}`;
  }
  if (typeof val === 'number') {
    // Check if it looks like an Excel serial date (range ~1900-2100)
    if (val > 1 && val < 100000) {
      const d = excelSerialToDate(val);
      if (d.getFullYear() >= 1990 && d.getFullYear() <= 2100) {
        return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      }
    }
    return String(val);
  }
  // If string, strip any URL lines and return the text part
  const str = String(val).trim();
  const lines = str.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const textLines = lines.filter((l) => !l.match(/^https?:\/\//i));
  return textLines.join(' ') || lines[0] || str;
}

// Clean main scope name: extract first line, remove URLs
function cleanScopeName(val) {
  if (!val) return '';
  const str = String(val).trim();
  // Take first non-empty line that is NOT a URL
  const lines = str.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (!line.match(/^https?:\/\//i)) return line;
  }
  return lines[0] || str;
}

// Parse "Kero = 100 EGP\nEngy = 100 EGP"
function parseOthers(str) {
  if (!str || str === '-' || str === 'undefined') return [];
  return String(str)
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => {
      const [name, rest] = line.split('=').map((s) => s.trim());
      const amountMatch = rest?.match(/[\d.]+/);
      const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;
      return { personName: name, amount };
    });
}

// Convert JS value to Firestore REST value format
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreDoc(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

async function firestoreRequest(method, urlPath, body) {
  const url = `${BASE_URL}${urlPath}`;
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore ${method} ${urlPath} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function createDoc(collectionName, data) {
  const result = await firestoreRequest('POST', `/${collectionName}`, toFirestoreDoc(data));
  const name = result.name;
  return name.split('/').pop();
}

async function listDocs(collectionName) {
  const docs = [];
  let pageToken = '';
  while (true) {
    const qs = pageToken ? `?pageToken=${pageToken}&pageSize=300` : '?pageSize=300';
    const result = await firestoreRequest('GET', `/${collectionName}${qs}`);
    if (result.documents) docs.push(...result.documents);
    if (!result.nextPageToken) break;
    pageToken = result.nextPageToken;
  }
  return docs;
}

async function deleteDoc(docName) {
  const url = `https://firestore.googleapis.com/v1/${docName}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Delete ${docName} failed (${res.status}): ${text}`);
  }
}

async function deleteCollection(collectionName) {
  const docs = await listDocs(collectionName);
  if (docs.length === 0) {
    console.log(`  ${collectionName}: already empty`);
    return;
  }
  for (let i = 0; i < docs.length; i += 50) {
    const batch = docs.slice(i, i + 50);
    await Promise.all(batch.map((d) => deleteDoc(d.name)));
  }
  console.log(`  ${collectionName}: deleted ${docs.length} docs`);
}

async function clearAll() {
  console.log('\n🗑  Clearing all collections...');
  await deleteCollection('mainScopes');
  await deleteCollection('payments');
  await deleteCollection('godsMoney');
  await deleteCollection('employees');
  await deleteCollection('salaryPayments');
  console.log('✅ All collections cleared.\n');
}

async function seedCareerPayments() {
  const filePath = path.join(__dirname, '..', 'My Career Payments .xlsx');
  const wb = XLSX.readFile(filePath, { cellDates: true });

  // --- Payments ---
  console.log('📄 Reading Payments sheet...');
  const paymentRows = XLSX.utils.sheet_to_json(wb.Sheets['Payments']);
  const validPayments = paymentRows.filter(
    (r) => r['Main Scope'] || r['Sub Scope'] || r['Received (EGP)']
  );

  let currentMainScope = '';
  const scopeNames = new Set();
  const scopeNotes = {};
  const payments = [];

  for (const r of validPayments) {
    if (r['Main Scope']) {
      const raw = String(r['Main Scope']);
      const cleaned = cleanScopeName(raw);
      currentMainScope = cleaned;
      // If the raw value contained a URL, store it as notes for that scope
      if (raw.includes('http')) {
        const urlMatch = raw.match(/https?:\/\/[^\s]+/i);
        if (urlMatch) scopeNotes[cleaned] = urlMatch[0];
      }
    }
    if (currentMainScope) scopeNames.add(currentMainScope);

    const receivedEGP = parseFloat(r['Received (EGP)']) || 0;
    const mineEGP = parseFloat(r['Mine (EGP)']) || 0;
    const godAmount = parseFloat(r['God']) || 0;
    const godPercentage = receivedEGP > 0 ? Math.round((godAmount / receivedEGP) * 10000) / 100 : 0;
    const date = parseDate(r['Date']);
    const subScope = formatSubScope(r['Sub Scope']);

    // Skip total/summary rows: no sub scope AND no date (these are Excel aggregation rows)
    if (!subScope && !date) continue;

    payments.push({
      mainScopeId: '',
      mainScopeName: currentMainScope,
      subScope,
      date,
      receivedEGP,
      mineEGP,
      others: parseOthers(r['Other']),
      godAmount,
      godPercentage,
      notes: '',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Write scopes
  console.log(`📝 Writing ${scopeNames.size} main scopes...`);
  const scopeIdMap = {};
  for (const name of scopeNames) {
    const id = await createDoc('mainScopes', {
      name,
      notes: scopeNotes[name] || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    scopeIdMap[name] = id;
  }

  // Write payments (in batches of 20 parallel)
  // Store mainScopeName for convenience (used in UI filtering/display)
  console.log(`📝 Writing ${payments.length} payments...`);
  for (let i = 0; i < payments.length; i += 20) {
    const batch = payments.slice(i, i + 20);
    await Promise.all(
      batch.map((p) => {
        p.mainScopeId = scopeIdMap[p.mainScopeName] || '';
        return createDoc('payments', p);
      })
    );
    process.stdout.write(`  ${Math.min(i + 20, payments.length)}/${payments.length}\r`);
  }
  console.log(`\n✅ Payments seeded: ${payments.length} records, ${scopeNames.size} scopes`);

  // --- GODs Money ---
  console.log('\n📄 Reading GODs Money sheet...');
  const godsRows = XLSX.utils.sheet_to_json(wb.Sheets['GODs Money']);
  // Filter: must have a valid # (number) AND at least Title or Responsible to
  const validGods = godsRows.filter((r) => {
    const num = r['#'];
    if (num === undefined || num === null || num === '' || String(num).toLowerCase() === 'total') return false;
    const isNumeric = (typeof num === 'number' && num > 0) || (!isNaN(parseInt(String(num))) && parseInt(String(num)) > 0);
    if (!isNumeric) return false;
    // Must also have at least Title or Responsible to
    return (r['Title'] && String(r['Title']).trim()) || (r['Responsible to'] && String(r['Responsible to']).trim());
  });

  console.log(`📝 Writing ${validGods.length} God's Money entries...`);
  for (let i = 0; i < validGods.length; i += 20) {
    const batch = validGods.slice(i, i + 20);
    await Promise.all(
      batch.map((r) => {
        const sendDate = parseDate(r['Sending Date']);
        const execDate = parseDate(r['Execution Date']);
        return createDoc('godsMoney', {
          responsibleTo: String(r['Responsible to'] || ''),
          title: String(r['Title'] || ''),
          description: String(r['Desciption'] || ''),
          priceEGP: parseFloat(r['Price (EGP)']) || 0,
          proof: String(r['Proof'] || ''),
          sendingDate: sendDate,
          executionDate: execDate,
          notes: '',
          attachments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      })
    );
  }
  console.log(`✅ God's Money seeded: ${validGods.length} records`);
}

async function seedSalaries() {
  const filePath = path.join(__dirname, '..', 'BeLightTech Salaries.xlsx');
  const wb = XLSX.readFile(filePath, { cellDates: true });

  // --- Employees ---
  console.log('\n📄 Reading Overview sheet (employees)...');
  const empRows = XLSX.utils.sheet_to_json(wb.Sheets['Overview']);
  // Filter: must have a non-empty Name
  const validEmps = empRows.filter((r) => r['Name'] && String(r['Name']).trim());

  console.log(`📝 Writing ${validEmps.length} employees...`);
  const empIdMap = {};
  for (const r of validEmps) {
    const name = String(r['Name']).trim();
    const id = await createDoc('employees', {
      name,
      position: String(r['Position'] || ''),
      baseSalary: parseFloat(r['Salary']) || 0,
      weekend: String(r['Weekend'] || ''),
      paymentMethod: String(r['Method'] || ''),
      accountNumber: String(r['Account'] || ''),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    empIdMap[name] = id;
  }
  console.log(`✅ Employees seeded: ${validEmps.length} records`);

  // --- Salary Payments ---
  console.log('\n📄 Reading Accumlative sheet (salary payments)...');
  const salRows = XLSX.utils.sheet_to_json(wb.Sheets['20242025 Accumlative']);
  const validSals = salRows.filter((r) => r['Name'] && String(r['Name']).trim() && r['Salary']);

  console.log(`📝 Writing ${validSals.length} salary payments...`);
  for (let i = 0; i < validSals.length; i += 20) {
    const batch = validSals.slice(i, i + 20);
    await Promise.all(
      batch.map((r) => {
        const name = String(r['Name']).trim();
        const date = parseDate(r['Date']);
        return createDoc('salaryPayments', {
          employeeId: empIdMap[name] || '',
          employeeName: name,
          position: String(r['Position'] || ''),
          date,
          amount: parseFloat(r['Salary']) || 0,
          comments: String(r['Comments'] || ''),
          notes: '',
          attachments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      })
    );
    process.stdout.write(`  ${Math.min(i + 20, validSals.length)}/${validSals.length}\r`);
  }
  console.log(`\n✅ Salary payments seeded: ${validSals.length} records`);
}

async function main() {
  try {
    await clearAll();
    console.log('🌱 Seeding Career Payments...');
    await seedCareerPayments();
    console.log('\n🌱 Seeding Salaries...');
    await seedSalaries();
    console.log('\n🎉 All data seeded successfully!');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

main();
