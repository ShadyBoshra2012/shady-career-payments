const XLSX = require('xlsx');
const path = require('path');

const PROJECT_ID = 'shady-career-payments';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Excel serial date to ISO string
function excelDateToISO(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString();
  }
  if (typeof val === 'string' && val.trim()) {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
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
      const currency = rest?.toUpperCase().includes('USD') ? 'USD' : 'EGP';
      return { personName: name, amount, currency };
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

async function createDoc(collection, data) {
  const result = await firestoreRequest('POST', `/${collection}`, toFirestoreDoc(data));
  // Extract doc ID from name like "projects/.../documents/collection/DOC_ID"
  const name = result.name;
  return name.split('/').pop();
}

async function listDocs(collection) {
  const docs = [];
  let pageToken = '';
  while (true) {
    const qs = pageToken ? `?pageToken=${pageToken}&pageSize=300` : '?pageSize=300';
    const result = await firestoreRequest('GET', `/${collection}${qs}`);
    if (result.documents) docs.push(...result.documents);
    if (!result.nextPageToken) break;
    pageToken = result.nextPageToken;
  }
  return docs;
}

async function deleteDoc(docName) {
  // docName is full path from list
  const url = `https://firestore.googleapis.com/v1/${docName}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Delete ${docName} failed (${res.status}): ${text}`);
  }
}

async function deleteCollection(collection) {
  const docs = await listDocs(collection);
  if (docs.length === 0) {
    console.log(`  ${collection}: already empty`);
    return;
  }
  // Delete in parallel batches of 50
  for (let i = 0; i < docs.length; i += 50) {
    const batch = docs.slice(i, i + 50);
    await Promise.all(batch.map((d) => deleteDoc(d.name)));
  }
  console.log(`  ${collection}: deleted ${docs.length} docs`);
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
  const wb = XLSX.readFile(filePath);

  // --- Payments ---
  console.log('📄 Reading Payments sheet...');
  const paymentRows = XLSX.utils.sheet_to_json(wb.Sheets['Payments']);
  const validPayments = paymentRows.filter(
    (r) => r['Main Scope'] || r['Sub Scope'] || r['Received (EGP)']
  );

  let currentMainScope = '';
  const scopeNames = new Set();
  const payments = [];

  for (const r of validPayments) {
    if (r['Main Scope']) currentMainScope = String(r['Main Scope']).trim();
    if (currentMainScope) scopeNames.add(currentMainScope);

    const receivedEGP = parseFloat(r['Received (EGP)']) || 0;
    const receivedUSD = r['Received (USD)'] && r['Received (USD)'] !== '-' ? parseFloat(r['Received (USD)']) || 0 : 0;
    const mineEGP = parseFloat(r['Mine (EGP)']) || 0;
    const mineUSD = r['Mine (USD)'] && r['Mine (USD)'] !== '-' ? parseFloat(r['Mine (USD)']) || 0 : 0;
    const godAmount = parseFloat(r['God']) || 0;
    const godPercentage = receivedEGP > 0 ? Math.round((godAmount / receivedEGP) * 10000) / 100 : 0;
    const dateISO = excelDateToISO(r['Date']);

    payments.push({
      mainScopeId: '',
      mainScopeName: currentMainScope,
      subScope: String(r['Sub Scope'] || ''),
      date: dateISO ? new Date(dateISO) : null,
      receivedEGP,
      receivedUSD,
      mineEGP,
      mineUSD,
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
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    scopeIdMap[name] = id;
  }

  // Write payments (in batches of 20 parallel)
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
  const validGods = godsRows.filter((r) => r['Responsible to'] || r['Title']);

  console.log(`📝 Writing ${validGods.length} God's Money entries...`);
  for (let i = 0; i < validGods.length; i += 20) {
    const batch = validGods.slice(i, i + 20);
    await Promise.all(
      batch.map((r) => {
        const sendDate = excelDateToISO(r['Sending Date']);
        const execDate = excelDateToISO(r['Execution Date']);
        return createDoc('godsMoney', {
          responsibleTo: String(r['Responsible to'] || ''),
          title: String(r['Title'] || ''),
          description: String(r['Desciption'] || ''),
          priceEGP: parseFloat(r['Price (EGP)']) || 0,
          proof: String(r['Proof'] || ''),
          sendingDate: sendDate ? new Date(sendDate) : null,
          executionDate: execDate ? new Date(execDate) : null,
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
  const wb = XLSX.readFile(filePath);

  // --- Employees ---
  console.log('\n📄 Reading Overview sheet (employees)...');
  const empRows = XLSX.utils.sheet_to_json(wb.Sheets['Overview']);
  const validEmps = empRows.filter((r) => r['Name']);

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
  const validSals = salRows.filter((r) => r['Name'] && r['Salary']);

  console.log(`📝 Writing ${validSals.length} salary payments...`);
  for (let i = 0; i < validSals.length; i += 20) {
    const batch = validSals.slice(i, i + 20);
    await Promise.all(
      batch.map((r) => {
        const name = String(r['Name']).trim();
        const dateISO = excelDateToISO(r['Date']);
        return createDoc('salaryPayments', {
          employeeId: empIdMap[name] || '',
          employeeName: name,
          position: String(r['Position'] || ''),
          date: dateISO ? new Date(dateISO) : null,
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
    console.log('\n🔄 Clearing all collections and retrying after fix...');
    try {
      await clearAll();
      console.log('🌱 Retrying: Seeding Career Payments...');
      await seedCareerPayments();
      console.log('\n🌱 Retrying: Seeding Salaries...');
      await seedSalaries();
      console.log('\n🎉 Retry succeeded! All data seeded.');
    } catch (retryErr) {
      console.error('\n❌ Retry also failed:', retryErr.message);
      process.exit(1);
    }
  }
}

main();
