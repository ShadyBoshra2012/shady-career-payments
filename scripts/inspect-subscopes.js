const XLSX = require('xlsx');
const path = require('path');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function excelSerialToDate(serial) {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

function formatSubScope(val) {
  if (!val && val !== 0) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    return `${MONTHS[val.getMonth()]} ${val.getFullYear()}`;
  }
  if (typeof val === 'number') {
    if (val > 1 && val < 100000) {
      const d = excelSerialToDate(val);
      if (d.getFullYear() >= 1990 && d.getFullYear() <= 2100) {
        return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      }
    }
    return String(val);
  }
  return String(val).trim();
}

const filePath = path.join(__dirname, '..', 'career-payments.xlsx');
const wb = XLSX.readFile(filePath, { cellDates: true });
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Payments']);

// Check all sub scopes that contain URLs or are Date objects
let currentMainScope = '';
for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  if (r['Main Scope']) currentMainScope = String(r['Main Scope']).trim().split(/\r?\n/)[0];
  const sub = r['Sub Scope'];
  const formatted = formatSubScope(sub);
  
  // Flag issues
  if (sub instanceof Date) {
    console.log(`Row ${i} [${currentMainScope}]: Date object → "${formatted}"`);
  }
  if (typeof sub === 'string' && sub.includes('http')) {
    console.log(`Row ${i} [${currentMainScope}]: URL in sub scope: "${sub.substring(0, 80)}..." → "${formatted.substring(0, 80)}"`);
  }
}
