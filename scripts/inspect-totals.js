const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'My Career Payments .xlsx');
const wb = XLSX.readFile(filePath, { cellDates: true });
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Payments']);

// Look for rows that might be total/summary rows
// Criteria: no Sub Scope AND large Received values, or Main Scope contains "Total"
let currentMainScope = '';
const suspectRows = [];

for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  if (r['Main Scope']) currentMainScope = String(r['Main Scope']).trim();

  const subScope = r['Sub Scope'];
  const received = parseFloat(r['Received (EGP)']) || 0;
  const date = r['Date'];

  // Flag rows with no sub scope but have large received values
  // or rows where sub scope is empty/undefined and received > 0
  if (!subScope && received > 1000) {
    suspectRows.push({
      index: i,
      mainScope: currentMainScope,
      subScope: subScope,
      date: date,
      received: received,
      mine: parseFloat(r['Mine (EGP)']) || 0,
      god: parseFloat(r['God']) || 0,
      allKeys: Object.keys(r).join(', '),
    });
  }
}

console.log(`Found ${suspectRows.length} suspect total/summary rows:\n`);
for (const r of suspectRows) {
  console.log(`  Row ${r.index}: [${r.mainScope}] Sub="${r.subScope}" Date=${r.date} Received=${r.received} Mine=${r.mine} God=${r.god}`);
}

// Also check: rows where Sub Scope is explicitly empty but received > some threshold
console.log('\n\n--- All rows with empty/no Sub Scope ---');
let count = 0;
currentMainScope = '';
for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  if (r['Main Scope']) currentMainScope = String(r['Main Scope']).trim();
  const subScope = r['Sub Scope'];
  const received = parseFloat(r['Received (EGP)']) || 0;
  if ((!subScope || String(subScope).trim() === '') && received > 0) {
    console.log(`  Row ${i}: [${currentMainScope}] Sub="${subScope}" Received=${received} Mine=${parseFloat(r['Mine (EGP)']) || 0}`);
    count++;
  }
}
console.log(`\nTotal rows with empty sub scope and received>0: ${count}`);

// Check if the total row pattern matches: is it always the last row of a scope group?
console.log('\n\n--- Last row per scope group ---');
currentMainScope = '';
let lastRowPerScope = {};
for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  if (r['Main Scope']) {
    const cleaned = String(r['Main Scope']).trim().split(/\r?\n/)[0];
    if (cleaned !== currentMainScope && currentMainScope) {
      // Previous scope ended, log its last row
      const last = lastRowPerScope[currentMainScope];
      if (last) {
        console.log(`  [${currentMainScope}] Last row ${last.i}: Sub="${last.sub}" Received=${last.received}`);
      }
    }
    currentMainScope = cleaned.match(/^https?:\/\//) ? 'URL_SCOPE' : cleaned;
  }
  lastRowPerScope[currentMainScope] = {
    i,
    sub: r['Sub Scope'],
    received: parseFloat(r['Received (EGP)']) || 0,
    mine: parseFloat(r['Mine (EGP)']) || 0,
  };
}
// Print the last one
if (currentMainScope && lastRowPerScope[currentMainScope]) {
  const last = lastRowPerScope[currentMainScope];
  console.log(`  [${currentMainScope}] Last row ${last.i}: Sub="${last.sub}" Received=${last.received}`);
}
