const admin = require('firebase-admin');
const XLSX = require('xlsx');
const path = require('path');

// Initialize Firebase Admin with project ID (uses application default credentials or service account)
admin.initializeApp({ projectId: 'shady-career-payments' });
const db = admin.firestore();

// Excel serial date to JS Date
function excelDate(val) {
  if (val instanceof Date) return val;
  if (typeof val === 'number') return new Date(Math.round((val - 25569) * 86400 * 1000));
  if (typeof val === 'string' && val.trim()) return new Date(val);
  return null;
}

// Parse "Name = 100 EGP\nName = 100 EGP" into structured splits
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

async function deleteCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    console.log(`  ${collectionName}: already empty`);
    return;
  }
  // Batch delete in groups of 450
  const batches = [];
  let batch = db.batch();
  let count = 0;
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    if (count % 450 === 0) {
      batches.push(batch);
      batch = db.batch();
    }
  }
  if (count % 450 !== 0) batches.push(batch);
  for (const b of batches) await b.commit();
  console.log(`  ${collectionName}: deleted ${snapshot.size} docs`);
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
  const filePath = path.join(__dirname, '..', 'career-payments.xlsx');
  const wb = XLSX.readFile(filePath);

  // --- Payments Sheet ---
  console.log('📄 Reading Payments sheet...');
  const paymentRows = XLSX.utils.sheet_to_json(wb.Sheets['Payments']);
  const validPayments = paymentRows.filter(
    (r) => r['Main Scope'] || r['Sub Scope'] || r['Received (EGP)']
  );

  // Track Main Scope inheritance (some rows have blank Main Scope, meaning same as above)
  let currentMainScope = '';
  const scopeNames = new Set();
  const payments = [];

  for (const r of validPayments) {
    if (r['Main Scope']) currentMainScope = String(r['Main Scope']).trim();
    if (currentMainScope) scopeNames.add(currentMainScope);

    const receivedEGP = parseFloat(r['Received (EGP)']) || 0;
    const mineEGP = parseFloat(r['Mine (EGP)']) || 0;
    const godAmount = parseFloat(r['God']) || 0;
    const godPercentage = receivedEGP > 0 ? Math.round((godAmount / receivedEGP) * 10000) / 100 : 0;

    const date = excelDate(r['Date']);

    payments.push({
      mainScopeId: '',
      mainScopeName: currentMainScope,
      subScope: String(r['Sub Scope'] || ''),
      date: date ? admin.firestore.Timestamp.fromDate(date) : null,
      receivedEGP,
      mineEGP,
      others: parseOthers(r['Other']),
      godAmount,
      godPercentage,
      notes: '',
      attachments: [],
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  // Write main scopes
  console.log(`📝 Writing ${scopeNames.size} main scopes...`);
  const scopeIdMap = {};
  for (const name of scopeNames) {
    const ref = await db.collection('mainScopes').add({
      name,
      notes: '',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
    scopeIdMap[name] = ref.id;
  }

  // Assign scope IDs to payments and batch write
  console.log(`📝 Writing ${payments.length} payments...`);
  for (let i = 0; i < payments.length; i += 450) {
    const batch = db.batch();
    const chunk = payments.slice(i, i + 450);
    for (const p of chunk) {
      p.mainScopeId = scopeIdMap[p.mainScopeName] || '';
      const ref = db.collection('payments').doc();
      batch.set(ref, p);
    }
    await batch.commit();
  }
  console.log(`✅ Payments seeded: ${payments.length} records, ${scopeNames.size} scopes`);

  // --- GODs Money Sheet ---
  console.log('\n📄 Reading GODs Money sheet...');
  const godsRows = XLSX.utils.sheet_to_json(wb.Sheets['GODs Money']);
  const validGods = godsRows.filter((r) => r['Responsible to'] || r['Title']);

  console.log(`📝 Writing ${validGods.length} God's Money entries...`);
  for (let i = 0; i < validGods.length; i += 450) {
    const batch = db.batch();
    const chunk = validGods.slice(i, i + 450);
    for (const r of chunk) {
      const sendDate = excelDate(r['Sending Date']);
      const execDate = excelDate(r['Execution Date']);
      const ref = db.collection('godsMoney').doc();
      batch.set(ref, {
        responsibleTo: String(r['Responsible to'] || ''),
        title: String(r['Title'] || ''),
        description: String(r['Desciption'] || ''),
        priceEGP: parseFloat(r['Price (EGP)']) || 0,
        proof: String(r['Proof'] || ''),
        sendingDate: sendDate ? admin.firestore.Timestamp.fromDate(sendDate) : null,
        executionDate: execDate ? admin.firestore.Timestamp.fromDate(execDate) : null,
        notes: '',
        attachments: [],
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }
    await batch.commit();
  }
  console.log(`✅ God's Money seeded: ${validGods.length} records`);
}

async function seedSalaries() {
  const filePath = path.join(__dirname, '..', 'salaries.xlsx');
  const wb = XLSX.readFile(filePath);

  // --- Overview Sheet (Employees) ---
  console.log('\n📄 Reading Overview sheet (employees)...');
  const empRows = XLSX.utils.sheet_to_json(wb.Sheets['Overview']);
  const validEmps = empRows.filter((r) => r['Name']);

  console.log(`📝 Writing ${validEmps.length} employees...`);
  const empIdMap = {};
  for (const r of validEmps) {
    const name = String(r['Name']).trim();
    const ref = await db.collection('employees').add({
      name,
      position: String(r['Position'] || ''),
      baseSalary: parseFloat(r['Salary']) || 0,
      weekend: String(r['Weekend'] || ''),
      paymentMethod: String(r['Method'] || ''),
      accountNumber: String(r['Account'] || ''),
      isActive: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
    empIdMap[name] = ref.id;
  }
  console.log(`✅ Employees seeded: ${validEmps.length} records`);

  // --- 20242025 Accumlative Sheet (Salary Payments) ---
  console.log('\n📄 Reading Accumlative sheet (salary payments)...');
  const salRows = XLSX.utils.sheet_to_json(wb.Sheets['20242025 Accumlative']);
  const validSals = salRows.filter((r) => r['Name'] && r['Salary']);

  console.log(`📝 Writing ${validSals.length} salary payments...`);
  for (let i = 0; i < validSals.length; i += 450) {
    const batch = db.batch();
    const chunk = validSals.slice(i, i + 450);
    for (const r of chunk) {
      const name = String(r['Name']).trim();
      const date = excelDate(r['Date']);
      const ref = db.collection('salaryPayments').doc();
      batch.set(ref, {
        employeeId: empIdMap[name] || '',
        employeeName: name,
        position: String(r['Position'] || ''),
        date: date ? admin.firestore.Timestamp.fromDate(date) : null,
        amount: parseFloat(r['Salary']) || 0,
        comments: String(r['Comments'] || ''),
        notes: '',
        attachments: [],
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }
    await batch.commit();
  }
  console.log(`✅ Salary payments seeded: ${validSals.length} records`);
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
    console.log('\n🔄 Clearing all collections and retrying...');
    await clearAll();
    try {
      console.log('🌱 Retrying: Seeding Career Payments...');
      await seedCareerPayments();
      console.log('\n🌱 Retrying: Seeding Salaries...');
      await seedSalaries();
      console.log('\n🎉 Retry succeeded! All data seeded.');
    } catch (retryErr) {
      console.error('\n❌ Retry also failed:', retryErr.message);
      console.error(retryErr.stack);
      process.exit(1);
    }
  }
  process.exit(0);
}

main();
