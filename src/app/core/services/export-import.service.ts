import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DataService } from './data.service';
import {
  Payment,
  MainScope,
  GodsMoney,
  Employee,
  SalaryPayment,
} from '../models';

export interface ExportData {
  version: string;
  exportedAt: string;
  mainScopes: MainScope[];
  payments: Payment[];
  godsMoney: GodsMoney[];
  employees: Employee[];
  salaryPayments: SalaryPayment[];
}

@Injectable({ providedIn: 'root' })
export class ExportImportService {
  private dataService = inject(DataService);

  async exportToJSON(): Promise<void> {
    const data = await this.gatherAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, `career-payments-export-${this.dateStamp()}.json`);
  }

  async exportToExcel(): Promise<void> {
    const data = await this.gatherAllData();
    const wb = XLSX.utils.book_new();

    // Main Scopes sheet
    const scopeRows = data.mainScopes.map((s) => ({
      ID: s.id,
      Name: s.name,
      Notes: s.notes || '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scopeRows), 'Main Scopes');

    // Payments sheet
    const paymentRows = data.payments.map((p) => ({
      ID: p.id,
      'Main Scope': p.mainScopeName,
      'Sub Scope': p.subScope,
      Date: p.date ? new Date(p.date).toLocaleDateString() : '',
      'Received (EGP)': p.receivedEGP || 0,
      'Mine (EGP)': p.mineEGP || 0,
      Others: p.others?.map((o) => `${o.personName} = ${o.amount} EGP`).join('\n') || '',
      'God Amount': p.godAmount || 0,
      'God %': p.godPercentage || 0,
      Notes: p.notes || '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentRows), 'Payments');

    // God's Money sheet
    const godsRows = data.godsMoney.map((g) => ({
      ID: g.id,
      'Responsible To': g.responsibleTo,
      Title: g.title,
      Description: g.description || '',
      'Price (EGP)': g.priceEGP,
      Proof: g.proof || '',
      'Sending Date': g.sendingDate ? new Date(g.sendingDate).toLocaleDateString() : '',
      'Execution Date': g.executionDate ? new Date(g.executionDate).toLocaleDateString() : '',
      Notes: g.notes || '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(godsRows), "God's Money");

    // Employees sheet
    const empRows = data.employees.map((e) => ({
      ID: e.id,
      Name: e.name,
      Position: e.position,
      'Base Salary': e.baseSalary,
      Weekend: e.weekend || '',
      'Payment Method': e.paymentMethod || '',
      Account: e.accountNumber || '',
      Active: e.isActive ? 'Yes' : 'No',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(empRows), 'Employees');

    // Salary Payments sheet
    const salRows = data.salaryPayments.map((s) => ({
      ID: s.id,
      Employee: s.employeeName,
      Position: s.position,
      Date: s.date ? new Date(s.date).toLocaleDateString() : '',
      Amount: s.amount,
      Comments: s.comments || '',
      Notes: s.notes || '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salRows), 'Salary Payments');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    saveAs(blob, `career-payments-export-${this.dateStamp()}.xlsx`);
  }

  async importFromJSON(file: File): Promise<{ counts: Record<string, number> }> {
    const text = await file.text();
    const data: ExportData = JSON.parse(text);
    return this.importData(data);
  }

  async importFromExcel(file: File): Promise<{ counts: Record<string, number> }> {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });
    const data = this.parseExcelWorkbook(wb);
    return this.importData(data);
  }

  private async importData(data: ExportData): Promise<{ counts: Record<string, number> }> {
    const counts: Record<string, number> = {};

    if (data.mainScopes?.length) {
      await this.dataService.batchImportMainScopes(
        data.mainScopes.map((s) => ({ name: s.name, notes: s.notes }))
      );
      counts['mainScopes'] = data.mainScopes.length;
    }

    if (data.employees?.length) {
      await this.dataService.batchImportEmployees(data.employees);
      counts['employees'] = data.employees.length;
    }

    if (data.payments?.length) {
      await this.dataService.batchImportPayments(data.payments);
      counts['payments'] = data.payments.length;
    }

    if (data.godsMoney?.length) {
      await this.dataService.batchImportGodsMoney(data.godsMoney);
      counts['godsMoney'] = data.godsMoney.length;
    }

    if (data.salaryPayments?.length) {
      await this.dataService.batchImportSalaryPayments(data.salaryPayments);
      counts['salaryPayments'] = data.salaryPayments.length;
    }

    return { counts };
  }

  private parseExcelWorkbook(wb: XLSX.WorkBook): ExportData {
    const data: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      mainScopes: [],
      payments: [],
      godsMoney: [],
      employees: [],
      salaryPayments: [],
    };

    if (wb.SheetNames.includes('Main Scopes')) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Main Scopes']);
      data.mainScopes = rows.map((r) => ({
        id: '',
        name: String(r['Name'] || ''),
        notes: String(r['Notes'] || ''),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    if (wb.SheetNames.includes('Payments')) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Payments']);
      data.payments = rows.map((r) => ({
        id: '',
        mainScopeId: '',
        mainScopeName: String(r['Main Scope'] || ''),
        subScope: String(r['Sub Scope'] || ''),
        date: r['Date'] ? new Date(String(r['Date'])) : new Date(),
        receivedEGP: Number(r['Received (EGP)']) || 0,
        mineEGP: Number(r['Mine (EGP)']) || 0,
        others: this.parseOthersString(String(r['Others'] || '')),
        godAmount: Number(r['God Amount']) || 0,
        godPercentage: Number(r['God %']) || 0,
        notes: String(r['Notes'] || ''),
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    if (wb.SheetNames.includes("God's Money")) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets["God's Money"]);
      data.godsMoney = rows.map((r) => ({
        id: '',
        responsibleTo: String(r['Responsible To'] || ''),
        title: String(r['Title'] || ''),
        description: String(r['Description'] || ''),
        priceEGP: Number(r['Price (EGP)']) || 0,
        proof: String(r['Proof'] || ''),
        sendingDate: r['Sending Date'] ? new Date(String(r['Sending Date'])) : new Date(),
        executionDate: r['Execution Date'] ? new Date(String(r['Execution Date'])) : new Date(),
        notes: String(r['Notes'] || ''),
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    if (wb.SheetNames.includes('Employees')) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Employees']);
      data.employees = rows.map((r) => ({
        id: '',
        name: String(r['Name'] || ''),
        position: String(r['Position'] || ''),
        baseSalary: Number(r['Base Salary']) || 0,
        weekend: String(r['Weekend'] || ''),
        paymentMethod: String(r['Payment Method'] || ''),
        accountNumber: String(r['Account'] || ''),
        isActive: String(r['Active']).toLowerCase() === 'yes',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    if (wb.SheetNames.includes('Salary Payments')) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Salary Payments']);
      data.salaryPayments = rows.map((r) => ({
        id: '',
        employeeId: '',
        employeeName: String(r['Employee'] || ''),
        position: String(r['Position'] || ''),
        date: r['Date'] ? new Date(String(r['Date'])) : new Date(),
        amount: Number(r['Amount']) || 0,
        comments: String(r['Comments'] || ''),
        notes: String(r['Notes'] || ''),
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    return data;
  }

  private parseOthersString(str: string): { personName: string; amount: number }[] {
    if (!str || str === '-' || str === 'undefined') return [];
    return str
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => {
        const parts = line.split('=').map((s) => s.trim());
        const amountStr = parts[1]?.replace(/[^0-9.]/g, '') || '0';
        return { personName: parts[0], amount: Number(amountStr) };
      });
  }

  private async gatherAllData(): Promise<ExportData> {
    const [mainScopes, payments, godsMoney, employees, salaryPayments] = await Promise.all([
      firstValueFrom(this.dataService.getMainScopes()),
      firstValueFrom(this.dataService.getPayments()),
      firstValueFrom(this.dataService.getGodsMoney()),
      firstValueFrom(this.dataService.getEmployees()),
      firstValueFrom(this.dataService.getSalaryPayments()),
    ]);

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      mainScopes: mainScopes || [],
      payments: payments || [],
      godsMoney: godsMoney || [],
      employees: employees || [],
      salaryPayments: salaryPayments || [],
    };
  }

  /**
   * Seed from the original "My Career Payments .xlsx" file.
   * Sheet "Payments" has columns: #, MainScope, SubScope, ReceivedEGP, MineEGP, Other, God, God%, Total, Date
   * Sheet "GODs Money" has columns: #, Responsible To, Title, Description, Price EGP, Proof, Sending Date, Execution Date
   */
  async seedFromCareerPaymentsExcel(file: File): Promise<void> {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });

    // Collect unique main scopes from Payments sheet
    const scopeNames = new Set<string>();
    const payments: Partial<Payment>[] = [];

    if (wb.SheetNames.includes('Payments')) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Payments']);
      for (const r of rows) {
        const mainScope = String(r['MainScope'] || r['Main Scope'] || r['mainScope'] || '').trim();
        if (mainScope) scopeNames.add(mainScope);

        const othersStr = String(r['Other'] || r['Others'] || r['other'] || '');
        const godAmt = Number(r['God'] || r['god'] || 0);
        const receivedEGP = Number(r['ReceivedEGP'] || r['Received EGP'] || r['receivedEGP'] || 0);
        const godPct = receivedEGP > 0 ? Math.round((godAmt / receivedEGP) * 10000) / 100 : Number(r['God%'] || r['God %'] || 0);

        let dateVal: Date;
        const rawDate = r['Date'] || r['date'];
        if (rawDate instanceof Date) {
          dateVal = rawDate;
        } else if (typeof rawDate === 'number') {
          // Excel serial date
          dateVal = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
        } else {
          dateVal = rawDate ? new Date(String(rawDate)) : new Date();
        }

        payments.push({
          mainScopeId: '',
          mainScopeName: mainScope,
          subScope: String(r['SubScope'] || r['Sub Scope'] || r['subScope'] || ''),
          date: dateVal,
          receivedEGP,
          mineEGP: Number(r['MineEGP'] || r['Mine EGP'] || r['mineEGP'] || 0),
          others: this.parseOthersString(othersStr),
          godAmount: godAmt,
          godPercentage: godPct,
          notes: '',
          attachments: [],
        });
      }
    }

    // Import main scopes
    if (scopeNames.size > 0) {
      await this.dataService.batchImportMainScopes(
        Array.from(scopeNames).map((name) => ({ name, notes: '' }))
      );
    }

    // Import payments
    if (payments.length > 0) {
      await this.dataService.batchImportPayments(payments);
    }

    // Import God's Money disbursements
    const godsSheetName = wb.SheetNames.find((n) => n.toLowerCase().includes('god'));
    if (godsSheetName) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[godsSheetName]);
      const godItems: Partial<GodsMoney>[] = rows.map((r) => {
        const parseDateField = (val: unknown): Date => {
          if (val instanceof Date) return val;
          if (typeof val === 'number') return new Date(Math.round((val - 25569) * 86400 * 1000));
          return val ? new Date(String(val)) : new Date();
        };

        return {
          responsibleTo: String(r['Responsible To'] || r['ResponsibleTo'] || ''),
          title: String(r['Title'] || r['title'] || ''),
          description: String(r['Description'] || r['description'] || ''),
          priceEGP: Number(r['Price EGP'] || r['PriceEGP'] || r['price'] || 0),
          proof: String(r['Proof'] || r['proof'] || ''),
          sendingDate: parseDateField(r['Sending Date'] || r['SendingDate']),
          executionDate: parseDateField(r['Execution Date'] || r['ExecutionDate']),
          notes: '',
          attachments: [],
        };
      });

      if (godItems.length > 0) {
        await this.dataService.batchImportGodsMoney(godItems);
      }
    }
  }

  /**
   * Seed from the original "BeLightTech Salaries.xlsx" file.
   * Sheet "Overview" has columns: #, Name, Position, Salary, Weekend, Method, Account
   * Sheet "20242025 Accumulative" has salary payment rows
   */
  async seedFromSalariesExcel(file: File): Promise<void> {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });

    // Import employees from Overview sheet
    const overviewSheet = wb.SheetNames.find((n) => n.toLowerCase().includes('overview'));
    if (overviewSheet) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[overviewSheet]);
      const employees: Partial<Employee>[] = rows
        .filter((r) => r['Name'] || r['name'])
        .map((r) => ({
          name: String(r['Name'] || r['name'] || ''),
          position: String(r['Position'] || r['position'] || ''),
          baseSalary: Number(r['Salary'] || r['salary'] || r['Base Salary'] || 0),
          weekend: String(r['Weekend'] || r['weekend'] || ''),
          paymentMethod: String(r['Method'] || r['Payment Method'] || ''),
          accountNumber: String(r['Account'] || r['account'] || ''),
          isActive: true,
        }));

      if (employees.length > 0) {
        await this.dataService.batchImportEmployees(employees);
      }
    }

    // Import salary payments from accumulative sheet
    const accSheet = wb.SheetNames.find((n) => n.toLowerCase().includes('accumul'));
    if (accSheet) {
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[accSheet]);
      const salaryPayments: Partial<SalaryPayment>[] = rows
        .filter((r) => r['Name'] || r['name'] || r['Employee'])
        .map((r) => {
          const rawDate = r['Date'] || r['date'] || r['Month'];
          let dateVal: Date;
          if (rawDate instanceof Date) {
            dateVal = rawDate;
          } else if (typeof rawDate === 'number') {
            dateVal = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
          } else {
            dateVal = rawDate ? new Date(String(rawDate)) : new Date();
          }

          return {
            employeeId: '',
            employeeName: String(r['Name'] || r['name'] || r['Employee'] || ''),
            position: String(r['Position'] || r['position'] || ''),
            date: dateVal,
            amount: Number(r['Amount'] || r['amount'] || r['Salary'] || r['salary'] || 0),
            comments: String(r['Comments'] || r['comments'] || r['Comment'] || ''),
            notes: '',
            attachments: [],
          };
        });

      if (salaryPayments.length > 0) {
        await this.dataService.batchImportSalaryPayments(salaryPayments);
      }
    }
  }

  private dateStamp(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
