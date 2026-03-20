const XLSX = require('xlsx');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '..', 'My Career Payments .xlsx'), { cellDates: true });
const payments = XLSX.utils.sheet_to_json(wb.Sheets['Payments']);

// Show all rows with their main scope and sub scope context
let currentMainScope = '';
console.log('=== ALL PAYMENTS (row | mainScope | subScope | date | received):');
for (let i = 0; i < payments.length; i++) {
  const r = payments[i];
  if (r['Main Scope']) currentMainScope = String(r['Main Scope']).trim();
  const sub = r['Sub Scope'];
  const date = r['Date'];
  const subIsDate = sub instanceof Date;
  const subStr = subIsDate ? sub.toISOString().slice(0, 10) : String(sub || '');
  const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : String(date || '');
  const received = r['Received (EGP)'] || '';
  const receivedUSD = r['Received (USD)'] || '';
  
  // Only show rows 70-110 and 145-170 and 208-227 (the numeric subscope ranges)
  if ((i >= 70 && i <= 110) || (i >= 145 && i <= 170) || (i >= 205 && i <= 227)) {
    console.log(`${i}\t${currentMainScope}\t${subStr}\t${dateStr}\t${received}\t${receivedUSD}\tsubIsDate=${subIsDate}`);
  }
}

// Also show all unique main scopes
console.log('\n=== ALL UNIQUE MAIN SCOPES:');
const scopes = new Set();
for (const r of payments) {
  if (r['Main Scope']) scopes.add(String(r['Main Scope']).trim());
}
Array.from(scopes).sort().forEach(s => console.log(' ', s));

// Count payments per main scope
console.log('\n=== PAYMENTS PER MAIN SCOPE:');
currentMainScope = '';
const scopeCounts = {};
for (const r of payments) {
  if (r['Main Scope']) currentMainScope = String(r['Main Scope']).trim();
  if (currentMainScope && (r['Sub Scope'] || r['Received (EGP)'])) {
    scopeCounts[currentMainScope] = (scopeCounts[currentMainScope] || 0) + 1;
  }
}
Object.entries(scopeCounts).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
  console.log(`  ${name}: ${count}`);
});

// Gods money with cellDates
console.log('\n=== GODS MONEY (all rows):');
const gods = XLSX.utils.sheet_to_json(wb.Sheets['GODs Money']);
for (let i = 0; i < gods.length; i++) {
  const r = gods[i];
  const sendDate = r['Sending Date'];
  const execDate = r['Execution Date'];
  console.log(JSON.stringify({
    num: r['#'],
    responsibleTo: r['Responsible to'],
    title: r['Title'],
    desc: r['Desciption'],
    price: r['Price (EGP)'],
    proof: r['Proof'],
    sendDate: sendDate instanceof Date ? sendDate.toISOString().slice(0, 10) : sendDate,
    execDate: execDate instanceof Date ? execDate.toISOString().slice(0, 10) : execDate,
  }));
}
