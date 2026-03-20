const XLSX = require('xlsx');
const path = require('path');

// Career Payments
const wb1 = XLSX.readFile(path.join(__dirname, '..', 'My Career Payments .xlsx'));
console.log('=== Career Payments Sheets:', wb1.SheetNames);

const payments = XLSX.utils.sheet_to_json(wb1.Sheets['Payments']);
console.log('\n=== Payment Headers:', Object.keys(payments[0]));
console.log('=== Total payment rows:', payments.length);

// Show first 10 rows
console.log('\n=== FIRST 10 rows:');
for (let i = 0; i < Math.min(10, payments.length); i++) {
  const r = payments[i];
  console.log(JSON.stringify({
    mainScope: r['Main Scope'],
    subScope: r['Sub Scope'],
    date: r['Date'],
    dateType: typeof r['Date'],
    received: r['Received (EGP)'],
    other: r['Other']
  }));
}

// Show last 10 rows
console.log('\n=== LAST 10 rows:');
for (let i = Math.max(0, payments.length - 10); i < payments.length; i++) {
  const r = payments[i];
  console.log(JSON.stringify({
    mainScope: r['Main Scope'],
    subScope: r['Sub Scope'],
    date: r['Date'],
    dateType: typeof r['Date'],
    received: r['Received (EGP)'],
  }));
}

// Find all rows where subScope is a number (Excel serial dates)
console.log('\n=== Sub Scopes that are pure numbers (likely Excel serial dates):');
const numericSubScopes = [];
for (let i = 0; i < payments.length; i++) {
  const sub = payments[i]['Sub Scope'];
  if (sub !== undefined && typeof sub === 'number') {
    numericSubScopes.push({ row: i, mainScope: payments[i]['Main Scope'], subScope: sub, date: payments[i]['Date'] });
  }
}
console.log('Count:', numericSubScopes.length);
numericSubScopes.forEach(s => console.log(JSON.stringify(s)));

// Find unique date types and formats in Sub Scope
console.log('\n=== All unique Sub Scope values (first 50):');
const uniqueSubs = new Set();
for (const r of payments) {
  const sub = r['Sub Scope'];
  if (sub !== undefined) uniqueSubs.add(String(sub));
}
const sortedSubs = Array.from(uniqueSubs).sort();
sortedSubs.slice(0, 50).forEach(s => console.log('  ', s));
console.log('... total unique sub scopes:', sortedSubs.length);
if (sortedSubs.length > 50) {
  console.log('Remaining:');
  sortedSubs.slice(50).forEach(s => console.log('  ', s));
}

// Date inspection
console.log('\n=== Date values - sample of various types:');
const dateSet = new Set();
for (const r of payments) {
  const d = r['Date'];
  if (d !== undefined) {
    dateSet.add(JSON.stringify({ val: d, type: typeof d }));
  }
}
const dateSamples = Array.from(dateSet);
dateSamples.slice(0, 20).forEach(s => console.log('  ', s));

// Read with raw: true to see raw cell values
console.log('\n=== RAW Sub Scope values (first 20 rows with cellDates):');
const wb2 = XLSX.readFile(path.join(__dirname, '..', 'My Career Payments .xlsx'), { cellDates: true });
const payments2 = XLSX.utils.sheet_to_json(wb2.Sheets['Payments']);
for (let i = 0; i < Math.min(20, payments2.length); i++) {
  const r = payments2[i];
  const sub = r['Sub Scope'];
  const date = r['Date'];
  if (sub !== undefined) {
    console.log(JSON.stringify({ row: i, subScope: sub, subType: typeof sub, subIsDate: sub instanceof Date, date: date, dateIsDate: date instanceof Date }));
  }
}

// GODs Money sheet
console.log('\n\n=== GODs Money Sheet:');
const gods = XLSX.utils.sheet_to_json(wb1.Sheets['GODs Money']);
console.log('Headers:', Object.keys(gods[0] || {}));
console.log('Row count:', gods.length);
gods.slice(0, 5).forEach(r => console.log(JSON.stringify(r)));

// Salaries
const wb3 = XLSX.readFile(path.join(__dirname, '..', 'BeLightTech Salaries.xlsx'));
console.log('\n=== Salaries Sheets:', wb3.SheetNames);
const overview = XLSX.utils.sheet_to_json(wb3.Sheets['Overview']);
console.log('Overview headers:', Object.keys(overview[0] || {}));
console.log('Employees:', overview.length);
overview.forEach(r => console.log(JSON.stringify(r)));

const accum = XLSX.utils.sheet_to_json(wb3.Sheets['20242025 Accumlative']);
console.log('\nAccumlative headers:', Object.keys(accum[0] || {}));
console.log('Salary entries:', accum.length);
accum.slice(0, 5).forEach(r => console.log(JSON.stringify(r)));
