import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { combineLatest } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { Payment, GodsMoney, SalaryPayment, DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
  ],
  template: `
    @if (loading) {
      <div class="loading"><mat-spinner></mat-spinner></div>
    } @else {
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-icon class="stat-icon income">trending_up</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalReceivedEGP | number:'1.0-0' }} EGP</span>
            <span class="stat-label">Total Received</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-icon mine">account_balance</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalMineEGP | number:'1.0-0' }} EGP</span>
            <span class="stat-label">My Earnings</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-icon god">volunteer_activism</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.godMoneyBalance | number:'1.0-0' }} EGP</span>
            <span class="stat-label">God's Money Balance</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-icon salary">paid</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalSalariesPaid | number:'1.0-0' }} EGP</span>
            <span class="stat-label">Salaries Paid</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-icon projects">folder</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.projectCount }}</span>
            <span class="stat-label">Projects</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-icon emp">people</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ stats.employeeCount }}</span>
            <span class="stat-label">Active Employees</span>
          </div>
        </mat-card>
      </div>

      <div class="charts-grid">
        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>Monthly Earnings Over Time</mat-card-title></mat-card-header>
          <mat-card-content>
            <canvas baseChart [datasets]="earningsChartData.datasets" [labels]="earningsChartData.labels"
              [options]="lineChartOptions" type="line"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>Earnings by Project</mat-card-title></mat-card-header>
          <mat-card-content>
            <canvas baseChart [datasets]="projectChartData.datasets" [labels]="projectChartData.labels"
              [options]="barChartOptions" type="bar"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>God's Money: Accumulated vs Disbursed</mat-card-title></mat-card-header>
          <mat-card-content>
            <canvas baseChart [datasets]="godChartData.datasets" [labels]="godChartData.labels"
              [options]="lineChartOptions" type="line"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>Accumulative Earnings</mat-card-title></mat-card-header>
          <mat-card-content>
            <canvas baseChart [datasets]="accumulativeChartData.datasets" [labels]="accumulativeChartData.labels"
              [options]="lineChartOptions" type="line"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>Salary Expenses by Employee</mat-card-title></mat-card-header>
          <mat-card-content>
            <canvas baseChart [datasets]="salaryByEmpChartData.datasets" [labels]="salaryByEmpChartData.labels"
              [options]="pieChartOptions" type="doughnut"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>Monthly Salary Expenses</mat-card-title></mat-card-header>
          <mat-card-content>
            <canvas baseChart [datasets]="salaryMonthlyChartData.datasets" [labels]="salaryMonthlyChartData.labels"
              [options]="barChartOptions" type="bar"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>God's Money Percentage Over Time</mat-card-title></mat-card-header>
          <mat-card-content>
            <canvas baseChart [datasets]="godPercentChartData.datasets" [labels]="godPercentChartData.labels"
              [options]="percentChartOptions" type="line"></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>Yearly Comparison</mat-card-title></mat-card-header>
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
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      gap: 16px;
    }
    .stat-icon { font-size: 36px; width: 36px; height: 36px; }
    .stat-icon.income { color: #2e7d32; }
    .stat-icon.mine { color: #1565c0; }
    .stat-icon.god { color: #f57f17; }
    .stat-icon.salary { color: #c62828; }
    .stat-icon.projects { color: #6a1b9a; }
    .stat-icon.emp { color: #00838f; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 20px; font-weight: 600; }
    .stat-label { font-size: 13px; color: #666; }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 16px;
    }
    .chart-card { padding: 8px; }
    .chart-card mat-card-content { height: 300px; position: relative; }
    canvas { width: 100% !important; height: 100% !important; }
    @media (max-width: 599px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px; gap: 8px; }
      .stat-icon { font-size: 24px; width: 24px; height: 24px; }
      .stat-value { font-size: 14px; }
      .stat-label { font-size: 11px; }
      .charts-grid { grid-template-columns: 1fr; }
      .chart-card mat-card-content { height: 250px; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private dataService = inject(DataService);

  loading = true;
  stats: DashboardStats = {
    totalReceivedEGP: 0, totalReceivedUSD: 0, totalMineEGP: 0, totalMineUSD: 0,
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
      this.dataService.getDashboardStats(),
      this.dataService.getPayments(),
      this.dataService.getGodsMoney(),
      this.dataService.getSalaryPayments(),
    ]).subscribe(([stats, payments, godsMoney, salaries]) => {
      this.stats = stats;
      this.buildEarningsChart(payments);
      this.buildProjectChart(payments);
      this.buildGodChart(payments, godsMoney);
      this.buildAccumulativeChart(payments);
      this.buildSalaryByEmpChart(salaries);
      this.buildSalaryMonthlyChart(salaries);
      this.buildGodPercentChart(payments);
      this.buildYearlyChart(payments);
      this.loading = false;
    });
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
