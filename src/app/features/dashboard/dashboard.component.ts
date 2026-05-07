import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { combineLatest } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { AmountVisibilityService } from '../../core/services/amount-visibility.service';
import { Payment, GodsMoney, SalaryPayment, DashboardStats } from '../../core/models';

type PeriodPreset = 'all-time' | 'last-week' | 'last-month' | 'last-year' | 'year-before' | 'two-years' | 'three-years' | 'custom';

interface DateRange {
  from: Date;
  to: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    BaseChartDirective,
  ],
  template: `
    @if (loading) {
      <div class="loading"><mat-spinner></mat-spinner></div>
    } @else {
      <div class="page-intro">
        <div class="intro-copy">
          <h1>Dashboard</h1>
          <p>Your financial overview at a glance</p>
        </div>

        <mat-card class="filter-card">
          <div class="filter-row">
            <mat-form-field appearance="outline" class="period-field">
              <mat-label>Period</mat-label>
              <mat-select [value]="selectedPeriod" (selectionChange)="onPeriodChange($event.value)">
                @for (option of periodOptions; track option.value) {
                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (selectedPeriod === 'custom') {
              <mat-form-field appearance="outline" class="date-field">
                <mat-label>From</mat-label>
                <input matInput [matDatepicker]="fromPicker" [value]="customFromDate" (dateChange)="onCustomFromDateChange($event.value)" />
                <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
                <mat-datepicker #fromPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="date-field">
                <mat-label>To</mat-label>
                <input matInput [matDatepicker]="toPicker" [value]="customToDate" (dateChange)="onCustomToDateChange($event.value)" />
                <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
                <mat-datepicker #toPicker></mat-datepicker>
              </mat-form-field>

              <button mat-flat-button color="primary" (click)="applyPeriodFilter()" [disabled]="!canApplyCustomRange()">Apply</button>
            }
          </div>
        </mat-card>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon-wrap green">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value" [class.blurred]="amountVis.hidden$ | async">{{ stats.totalReceivedEGP | number:'1.0-0' }}</span>
            <span class="stat-label">Total Received (EGP)</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap blue">
            <mat-icon>account_balance</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value" [class.blurred]="amountVis.hidden$ | async">{{ stats.totalMineEGP | number:'1.0-0' }}</span>
            <span class="stat-label">My Earnings (EGP)</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap orange">
            <mat-icon>volunteer_activism</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value" [class.blurred]="amountVis.hidden$ | async">{{ stats.totalGodMoney | number:'1.0-0' }}</span>
            <span class="stat-label">God's Money Accumulated</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap red">
            <mat-icon>paid</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value" [class.blurred]="amountVis.hidden$ | async">{{ stats.totalSalariesPaid | number:'1.0-0' }}</span>
            <span class="stat-label">Salaries Paid (EGP)</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap purple">
            <mat-icon>folder</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.projectCount }}</span>
            <span class="stat-label">Projects</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap teal">
            <mat-icon>people</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.employeeCount }}</span>
            <span class="stat-label">Active Employees</span>
          </div>
        </div>
      </div>

      <div class="charts-grid" [class.blurred]="amountVis.hidden$ | async">
        <mat-card class="chart-card">
          <div class="chart-header">
            <h3>Monthly Earnings Over Time</h3>
          </div>
          <mat-card-content>
            <canvas baseChart [datasets]="earningsChartData.datasets" [labels]="earningsChartData.labels"
              [options]="lineChartOptions" type="line"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <div class="chart-header">
            <h3>Earnings by Project</h3>
          </div>
          <mat-card-content>
            <canvas baseChart [datasets]="projectChartData.datasets" [labels]="projectChartData.labels"
              [options]="barChartOptions" type="bar"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <div class="chart-header">
            <h3>God's Money: Accumulated vs Disbursed</h3>
          </div>
          <mat-card-content>
            <canvas baseChart [datasets]="godChartData.datasets" [labels]="godChartData.labels"
              [options]="lineChartOptions" type="line"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <div class="chart-header">
            <h3>Accumulative Earnings</h3>
          </div>
          <mat-card-content>
            <canvas baseChart [datasets]="accumulativeChartData.datasets" [labels]="accumulativeChartData.labels"
              [options]="lineChartOptions" type="line"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <div class="chart-header">
            <h3>Salary Expenses by Employee</h3>
          </div>
          <mat-card-content>
            <canvas baseChart [datasets]="salaryByEmpChartData.datasets" [labels]="salaryByEmpChartData.labels"
              [options]="pieChartOptions" type="doughnut"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <div class="chart-header">
            <h3>Monthly Salary Expenses</h3>
          </div>
          <mat-card-content>
            <canvas baseChart [datasets]="salaryMonthlyChartData.datasets" [labels]="salaryMonthlyChartData.labels"
              [options]="barChartOptions" type="bar"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <div class="chart-header">
            <h3>God's Money Percentage Over Time</h3>
          </div>
          <mat-card-content>
            <canvas baseChart [datasets]="godPercentChartData.datasets" [labels]="godPercentChartData.labels"
              [options]="percentChartOptions" type="line"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <div class="chart-header">
            <h3>Yearly Comparison</h3>
          </div>
          <mat-card-content>
            <canvas baseChart [datasets]="yearlyChartData.datasets" [labels]="yearlyChartData.labels"
              [options]="barChartOptions" type="bar"></canvas>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .loading { display: flex; justify-content: center; padding: 48px; }

    .page-intro {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 22px;
    }
    .intro-copy {
      min-width: 220px;
    }
    .page-intro h1 {
      font-size: 28px; font-weight: 700; margin: 0 0 4px;
      color: var(--text-primary); letter-spacing: -0.3px;
    }
    .page-intro p {
      font-size: 14px; color: var(--text-muted); margin: 0;
    }

    .filter-card {
      margin-bottom: 0;
      padding: 12px 14px 0 !important;
      border-radius: var(--radius-lg);
      border: 1px solid rgba(67, 97, 238, 0.18);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 249, 255, 0.95) 100%);
      box-shadow: 0 12px 24px rgba(31, 41, 55, 0.08);
    }
    .filter-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
    }
    .period-field {
      width: 240px;
      max-width: 100%;
    }
    .date-field {
      width: 200px;
      max-width: 100%;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      display: flex; align-items: center; gap: 16px;
      padding: 20px;
      background: var(--surface-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .stat-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    .stat-icon-wrap {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon-wrap mat-icon {
      font-size: 24px; width: 24px; height: 24px; color: #fff;
    }
    .stat-icon-wrap.green { background: linear-gradient(135deg, #0ead69, #059652); }
    .stat-icon-wrap.blue { background: linear-gradient(135deg, #4361ee, #3651d4); }
    .stat-icon-wrap.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .stat-icon-wrap.red { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .stat-icon-wrap.purple { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
    .stat-icon-wrap.teal { background: linear-gradient(135deg, #06b6d4, #0891b2); }
    .stat-info { display: flex; flex-direction: column; min-width: 0; }
    .stat-value {
      font-size: 22px; font-weight: 700; color: var(--text-primary);
      letter-spacing: -0.5px; line-height: 1.2;
    }
    .stat-label {
      font-size: 12px; color: var(--text-muted);
      font-weight: 500; margin-top: 2px;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 20px;
    }
    .chart-card {
      padding: 0 !important;
      overflow: hidden;
    }
    .chart-header {
      padding: 20px 24px 0;
    }
    .chart-header h3 {
      margin: 0; font-size: 15px; font-weight: 600;
      color: var(--text-primary);
    }
    .chart-card mat-card-content { height: 300px; position: relative; padding: 12px 16px 16px; }
    canvas { width: 100% !important; height: 100% !important; }

    @media (max-width: 599px) {
      .page-intro {
        flex-direction: column;
        align-items: stretch;
      }
      .filter-card {
        padding: 12px 12px 0 !important;
      }
      .period-field,
      .date-field {
        width: 100%;
      }
      .filter-row {
        justify-content: stretch;
      }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .stat-card { padding: 14px; gap: 12px; }
      .stat-icon-wrap { width: 40px; height: 40px; border-radius: 10px; }
      .stat-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; }
      .stat-value { font-size: 16px; }
      .stat-label { font-size: 11px; }
      .charts-grid { grid-template-columns: 1fr; }
      .chart-card mat-card-content { height: 250px; }
      .page-intro h1 { font-size: 22px; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  amountVis = inject(AmountVisibilityService);

  periodOptions: Array<{ value: PeriodPreset; label: string }> = [
    { value: 'all-time', label: 'All the time' },
    { value: 'last-week', label: 'Last Week' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-year', label: 'Last Year' },
    { value: 'year-before', label: 'Year Before' },
    { value: 'two-years', label: '2 Years' },
    { value: 'three-years', label: '3 Years' },
    { value: 'custom', label: 'Custom Dates' },
  ];
  selectedPeriod: PeriodPreset = 'two-years';
  customFromDate: Date | null = null;
  customToDate: Date | null = null;

  allPayments: Payment[] = [];
  allGodsMoney: GodsMoney[] = [];
  allSalaries: SalaryPayment[] = [];

  loading = true;
  stats: DashboardStats = {
    totalReceivedEGP: 0, totalMineEGP: 0,
    totalGodMoney: 0, totalGodDisbursed: 0, godMoneyBalance: 0,
    totalSalariesPaid: 0, projectCount: 0, employeeCount: 0,
  };

  earningsChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  projectChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  godChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  accumulativeChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  salaryByEmpChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  salaryMonthlyChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  godPercentChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  yearlyChartData: ChartConfiguration['data'] = { labels: [], datasets: [] };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };
  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } },
  };
  percentChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true, max: 100 } },
  };

  ngOnInit() {
    combineLatest([
      this.dataService.getPayments(),
      this.dataService.getGodsMoney(),
      this.dataService.getSalaryPayments(),
    ]).subscribe(([payments, godsMoney, salaries]) => {
      this.allPayments = payments;
      this.allGodsMoney = godsMoney;
      this.allSalaries = salaries;
      this.applyPeriodFilter();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  onPeriodChange(period: PeriodPreset) {
    this.selectedPeriod = period;
    if (period !== 'custom') {
      this.applyPeriodFilter();
    }
  }

  onCustomFromDateChange(date: Date | null) {
    this.customFromDate = date;
  }

  onCustomToDateChange(date: Date | null) {
    this.customToDate = date;
  }

  canApplyCustomRange(): boolean {
    if (!this.customFromDate || !this.customToDate) {
      return false;
    }
    return this.startOfDay(this.customFromDate) <= this.endOfDay(this.customToDate);
  }

  applyPeriodFilter() {
    const range = this.resolveDateRange();
    const payments = this.filterByDateRange(this.allPayments, (item) => item.date, range);
    const godsMoney = this.filterByDateRange(this.allGodsMoney, (item) => item.sendingDate, range);
    const salaries = this.filterByDateRange(this.allSalaries, (item) => item.date, range);

    this.stats = this.calculateStats(payments, godsMoney, salaries);
    this.buildEarningsChart(payments);
    this.buildProjectChart(payments);
    this.buildGodChart(payments, godsMoney);
    this.buildAccumulativeChart(payments);
    this.buildSalaryByEmpChart(salaries);
    this.buildSalaryMonthlyChart(salaries);
    this.buildGodPercentChart(payments);
    this.buildYearlyChart(payments);
  }

  private calculateStats(payments: Payment[], godsMoney: GodsMoney[], salaries: SalaryPayment[]): DashboardStats {
    const projectIds = new Set<string>();
    for (const payment of payments) {
      if (payment.mainScopeId) {
        projectIds.add(payment.mainScopeId);
      } else if (payment.mainScopeName) {
        projectIds.add(payment.mainScopeName);
      }
    }

    const employeeIds = new Set<string>();
    for (const salary of salaries) {
      if (salary.employeeId) {
        employeeIds.add(salary.employeeId);
      } else if (salary.employeeName) {
        employeeIds.add(salary.employeeName);
      }
    }

    const totalReceivedEGP = payments.reduce((sum, payment) => sum + (payment.receivedEGP || 0), 0);
    const totalMineEGP = payments.reduce((sum, payment) => sum + (payment.mineEGP || 0), 0);
    const totalGodMoney = payments.reduce((sum, payment) => sum + (payment.godAmount || 0), 0);
    const totalGodDisbursed = godsMoney.reduce((sum, god) => sum + (god.priceEGP || 0), 0);
    const totalSalariesPaid = salaries.reduce((sum, salary) => sum + (salary.amount || 0), 0);

    return {
      totalReceivedEGP,
      totalMineEGP,
      totalGodMoney,
      totalGodDisbursed,
      godMoneyBalance: totalGodMoney - totalGodDisbursed,
      totalSalariesPaid,
      projectCount: projectIds.size,
      employeeCount: employeeIds.size,
    };
  }

  private resolveDateRange(): DateRange | null {
    const now = new Date();

    switch (this.selectedPeriod) {
      case 'all-time':
        return null;
      case 'last-week':
        return { from: this.startOfDay(this.addDays(now, -7)), to: this.endOfDay(now) };
      case 'last-month':
        return { from: this.startOfDay(this.addMonths(now, -1)), to: this.endOfDay(now) };
      case 'last-year':
        return { from: this.startOfDay(this.addYears(now, -1)), to: this.endOfDay(now) };
      case 'year-before':
        return {
          from: this.startOfDay(this.addYears(now, -2)),
          to: this.endOfDay(this.addYears(now, -1)),
        };
      case 'two-years':
        return { from: this.startOfDay(this.addYears(now, -2)), to: this.endOfDay(now) };
      case 'three-years':
        return { from: this.startOfDay(this.addYears(now, -3)), to: this.endOfDay(now) };
      case 'custom':
      default:
        if (this.customFromDate && this.customToDate) {
          return {
            from: this.startOfDay(this.customFromDate),
            to: this.endOfDay(this.customToDate),
          };
        }
        return { from: this.startOfDay(this.addYears(now, -2)), to: this.endOfDay(now) };
    }
  }

  private filterByDateRange<T>(items: T[], getDate: (item: T) => Date | string | undefined, range: DateRange | null): T[] {
    if (!range) {
      return [...items];
    }
    return items.filter((item) => {
      const rawDate = getDate(item);
      if (!rawDate) {
        return false;
      }
      const date = new Date(rawDate);
      return date >= range.from && date <= range.to;
    });
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  private addYears(date: Date, years: number): Date {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  private monthKey(d: Date): string {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private buildEarningsChart(payments: Payment[]) {
    const monthly = new Map<string, { received: number; mine: number }>();
    for (const p of payments) {
      if (!p.date) continue;
      const key = this.monthKey(p.date);
      const cur = monthly.get(key) || { received: 0, mine: 0 };
      cur.received += p.receivedEGP || 0;
      cur.mine += p.mineEGP || 0;
      monthly.set(key, cur);
    }
    const keys = Array.from(monthly.keys()).sort();
    this.earningsChartData = {
      labels: keys,
      datasets: [
        { data: keys.map((k) => monthly.get(k)!.received), label: 'Received (EGP)', borderColor: '#2e7d32', backgroundColor: 'rgba(46,125,50,0.1)', fill: true },
        { data: keys.map((k) => monthly.get(k)!.mine), label: 'Mine (EGP)', borderColor: '#1565c0', backgroundColor: 'rgba(21,101,192,0.1)', fill: true },
      ],
    };
  }

  private buildProjectChart(payments: Payment[]) {
    const projects = new Map<string, number>();
    for (const p of payments) {
      const name = p.mainScopeName || 'Unknown';
      projects.set(name, (projects.get(name) || 0) + (p.receivedEGP || 0));
    }
    const sorted = Array.from(projects.entries()).sort((a, b) => b[1] - a[1]);
    this.projectChartData = {
      labels: sorted.map((s) => s[0]),
      datasets: [{ data: sorted.map((s) => s[1]), label: 'Total Received (EGP)', backgroundColor: '#1565c0' }],
    };
  }

  private buildGodChart(payments: Payment[], godsMoney: GodsMoney[]) {
    const monthly = new Map<string, number>();
    for (const p of payments) {
      if (!p.date) continue;
      const key = this.monthKey(p.date);
      monthly.set(key, (monthly.get(key) || 0) + (p.godAmount || 0));
    }
    const disbursedMonthly = new Map<string, number>();
    for (const g of godsMoney) {
      if (!g.sendingDate) continue;
      const key = this.monthKey(g.sendingDate);
      disbursedMonthly.set(key, (disbursedMonthly.get(key) || 0) + (g.priceEGP || 0));
    }
    const allKeys = Array.from(new Set([...monthly.keys(), ...disbursedMonthly.keys()])).sort();
    let accGod = 0, accDisbursed = 0;
    const godAcc: number[] = [];
    const disAcc: number[] = [];
    for (const key of allKeys) {
      accGod += monthly.get(key) || 0;
      accDisbursed += disbursedMonthly.get(key) || 0;
      godAcc.push(accGod);
      disAcc.push(accDisbursed);
    }
    this.godChartData = {
      labels: allKeys,
      datasets: [
        { data: godAcc, label: 'Accumulated', borderColor: '#f57f17', backgroundColor: 'rgba(245,127,23,0.1)', fill: true },
        { data: disAcc, label: 'Disbursed', borderColor: '#c62828', backgroundColor: 'rgba(198,40,40,0.1)', fill: true },
      ],
    };
  }

  private buildAccumulativeChart(payments: Payment[]) {
    const monthly = new Map<string, number>();
    for (const p of payments) {
      if (!p.date) continue;
      const key = this.monthKey(p.date);
      monthly.set(key, (monthly.get(key) || 0) + (p.receivedEGP || 0));
    }
    const keys = Array.from(monthly.keys()).sort();
    let acc = 0;
    const accData = keys.map((k) => { acc += monthly.get(k) || 0; return acc; });
    this.accumulativeChartData = {
      labels: keys,
      datasets: [{ data: accData, label: 'Accumulative (EGP)', borderColor: '#6a1b9a', backgroundColor: 'rgba(106,27,154,0.1)', fill: true }],
    };
  }

  private buildSalaryByEmpChart(salaries: SalaryPayment[]) {
    const byEmp = new Map<string, number>();
    for (const s of salaries) {
      byEmp.set(s.employeeName, (byEmp.get(s.employeeName) || 0) + (s.amount || 0));
    }
    const colors = ['#1565c0', '#2e7d32', '#f57f17', '#c62828', '#6a1b9a', '#00838f', '#e65100', '#ad1457'];
    this.salaryByEmpChartData = {
      labels: Array.from(byEmp.keys()),
      datasets: [{ data: Array.from(byEmp.values()), backgroundColor: colors.slice(0, byEmp.size) }],
    };
  }

  private buildSalaryMonthlyChart(salaries: SalaryPayment[]) {
    const monthly = new Map<string, number>();
    for (const s of salaries) {
      if (!s.date) continue;
      const key = this.monthKey(s.date);
      monthly.set(key, (monthly.get(key) || 0) + (s.amount || 0));
    }
    const keys = Array.from(monthly.keys()).sort();
    this.salaryMonthlyChartData = {
      labels: keys,
      datasets: [{ data: keys.map((k) => monthly.get(k) || 0), label: 'Salaries Paid (EGP)', backgroundColor: '#c62828' }],
    };
  }

  private buildGodPercentChart(payments: Payment[]) {
    const monthly = new Map<string, { received: number; god: number }>();
    for (const p of payments) {
      if (!p.date) continue;
      const key = this.monthKey(p.date);
      const cur = monthly.get(key) || { received: 0, god: 0 };
      cur.received += p.receivedEGP || 0;
      cur.god += p.godAmount || 0;
      monthly.set(key, cur);
    }
    const keys = Array.from(monthly.keys()).sort();
    this.godPercentChartData = {
      labels: keys,
      datasets: [{
        data: keys.map((k) => {
          const v = monthly.get(k)!;
          return v.received > 0 ? Math.round((v.god / v.received) * 10000) / 100 : 0;
        }),
        label: 'God %', borderColor: '#f57f17', backgroundColor: 'rgba(245,127,23,0.1)', fill: true,
      }],
    };
  }

  private buildYearlyChart(payments: Payment[]) {
    const yearly = new Map<number, number>();
    for (const p of payments) {
      if (!p.date) continue;
      const year = new Date(p.date).getFullYear();
      yearly.set(year, (yearly.get(year) || 0) + (p.receivedEGP || 0));
    }
    const years = Array.from(yearly.keys()).sort();
    this.yearlyChartData = {
      labels: years.map(String),
      datasets: [{ data: years.map((y) => yearly.get(y) || 0), label: 'Yearly Income (EGP)', backgroundColor: '#1565c0' }],
    };
  }
}
