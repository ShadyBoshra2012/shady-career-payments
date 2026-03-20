import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { FirestoreService } from './firestore.service';
import {
  Payment,
  MainScope,
  GodsMoney,
  Employee,
  SalaryPayment,
  DashboardStats,
} from '../models';

@Injectable({ providedIn: 'root' })
export class DataService {
  private fs = inject(FirestoreService);

  // Main Scopes
  getMainScopes(): Observable<MainScope[]> {
    return this.fs.getCollection<MainScope>('mainScopes', 'name');
  }

  async addMainScope(data: Partial<MainScope>): Promise<string> {
    return this.fs.addDocument('mainScopes', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Record<string, unknown>);
  }

  async updateMainScope(id: string, data: Partial<MainScope>): Promise<void> {
    return this.fs.updateDocument(`mainScopes/${id}`, {
      ...data,
      updatedAt: new Date(),
    } as Record<string, unknown>);
  }

  async deleteMainScope(id: string): Promise<void> {
    return this.fs.deleteDocument(`mainScopes/${id}`);
  }

  // Payments
  getPayments(): Observable<Payment[]> {
    return this.fs.getCollectionAsc<Payment>('payments', 'date');
  }

  async addPayment(data: Partial<Payment>): Promise<string> {
    return this.fs.addDocument('payments', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Record<string, unknown>);
  }

  async updatePayment(id: string, data: Partial<Payment>): Promise<void> {
    return this.fs.updateDocument(`payments/${id}`, {
      ...data,
      updatedAt: new Date(),
    } as Record<string, unknown>);
  }

  async deletePayment(id: string): Promise<void> {
    return this.fs.deleteDocument(`payments/${id}`);
  }

  // God's Money
  getGodsMoney(): Observable<GodsMoney[]> {
    return this.fs.getCollectionAsc<GodsMoney>('godsMoney', 'sendingDate');
  }

  async addGodsMoney(data: Partial<GodsMoney>): Promise<string> {
    return this.fs.addDocument('godsMoney', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Record<string, unknown>);
  }

  async updateGodsMoney(id: string, data: Partial<GodsMoney>): Promise<void> {
    return this.fs.updateDocument(`godsMoney/${id}`, {
      ...data,
      updatedAt: new Date(),
    } as Record<string, unknown>);
  }

  async deleteGodsMoney(id: string): Promise<void> {
    return this.fs.deleteDocument(`godsMoney/${id}`);
  }

  // Employees
  getEmployees(): Observable<Employee[]> {
    return this.fs.getCollection<Employee>('employees', 'name');
  }

  async addEmployee(data: Partial<Employee>): Promise<string> {
    return this.fs.addDocument('employees', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Record<string, unknown>);
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<void> {
    return this.fs.updateDocument(`employees/${id}`, {
      ...data,
      updatedAt: new Date(),
    } as Record<string, unknown>);
  }

  async deleteEmployee(id: string): Promise<void> {
    return this.fs.deleteDocument(`employees/${id}`);
  }

  // Salary Payments
  getSalaryPayments(): Observable<SalaryPayment[]> {
    return this.fs.getCollectionAsc<SalaryPayment>('salaryPayments', 'date');
  }

  async addSalaryPayment(data: Partial<SalaryPayment>): Promise<string> {
    return this.fs.addDocument('salaryPayments', {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Record<string, unknown>);
  }

  async updateSalaryPayment(id: string, data: Partial<SalaryPayment>): Promise<void> {
    return this.fs.updateDocument(`salaryPayments/${id}`, {
      ...data,
      updatedAt: new Date(),
    } as Record<string, unknown>);
  }

  async deleteSalaryPayment(id: string): Promise<void> {
    return this.fs.deleteDocument(`salaryPayments/${id}`);
  }

  // Dashboard Stats
  getDashboardStats(): Observable<DashboardStats> {
    return combineLatest([
      this.getPayments(),
      this.getGodsMoney(),
      this.getEmployees(),
      this.getSalaryPayments(),
      this.getMainScopes(),
    ]).pipe(
      map(([payments, godsMoney, employees, salaries, scopes]) => {
        const totalReceivedEGP = payments.reduce((s, p) => s + (p.receivedEGP || 0), 0);
        const totalReceivedUSD = payments.reduce((s, p) => s + (p.receivedUSD || 0), 0);
        const totalMineEGP = payments.reduce((s, p) => s + (p.mineEGP || 0), 0);
        const totalMineUSD = payments.reduce((s, p) => s + (p.mineUSD || 0), 0);
        const totalGodMoney = payments.reduce((s, p) => s + (p.godAmount || 0), 0);
        const totalGodDisbursed = godsMoney.reduce((s, g) => s + (g.priceEGP || 0), 0);
        const totalSalariesPaid = salaries.reduce((s, sal) => s + (sal.amount || 0), 0);

        return {
          totalReceivedEGP,
          totalReceivedUSD,
          totalMineEGP,
          totalMineUSD,
          totalGodMoney,
          totalGodDisbursed,
          godMoneyBalance: totalGodMoney - totalGodDisbursed,
          totalSalariesPaid,
          projectCount: scopes.length,
          employeeCount: employees.filter((e) => e.isActive).length,
        };
      })
    );
  }

  // Batch import
  async batchImportPayments(payments: Partial<Payment>[]): Promise<void> {
    const ops = payments.map((p) => ({
      path: 'payments',
      data: { ...p, createdAt: new Date(), updatedAt: new Date() } as Record<string, unknown>,
    }));
    // Firestore batch limit is 500
    for (let i = 0; i < ops.length; i += 450) {
      await this.fs.batchWrite(ops.slice(i, i + 450));
    }
  }

  async batchImportGodsMoney(items: Partial<GodsMoney>[]): Promise<void> {
    const ops = items.map((g) => ({
      path: 'godsMoney',
      data: { ...g, createdAt: new Date(), updatedAt: new Date() } as Record<string, unknown>,
    }));
    for (let i = 0; i < ops.length; i += 450) {
      await this.fs.batchWrite(ops.slice(i, i + 450));
    }
  }

  async batchImportEmployees(items: Partial<Employee>[]): Promise<void> {
    const ops = items.map((e) => ({
      path: 'employees',
      data: { ...e, createdAt: new Date(), updatedAt: new Date() } as Record<string, unknown>,
    }));
    for (let i = 0; i < ops.length; i += 450) {
      await this.fs.batchWrite(ops.slice(i, i + 450));
    }
  }

  async batchImportSalaryPayments(items: Partial<SalaryPayment>[]): Promise<void> {
    const ops = items.map((s) => ({
      path: 'salaryPayments',
      data: { ...s, createdAt: new Date(), updatedAt: new Date() } as Record<string, unknown>,
    }));
    for (let i = 0; i < ops.length; i += 450) {
      await this.fs.batchWrite(ops.slice(i, i + 450));
    }
  }

  async batchImportMainScopes(items: Partial<MainScope>[]): Promise<void> {
    const ops = items.map((m) => ({
      path: 'mainScopes',
      data: { ...m, createdAt: new Date(), updatedAt: new Date() } as Record<string, unknown>,
    }));
    for (let i = 0; i < ops.length; i += 450) {
      await this.fs.batchWrite(ops.slice(i, i + 450));
    }
  }
}
