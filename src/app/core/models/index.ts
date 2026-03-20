export interface MainScope {
  id: string;
  name: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentSplit {
  personName: string;
  amount: number;
  currency: 'EGP' | 'USD';
}

export interface PaymentAttachment {
  id: string;
  url: string;
  name: string;
  type: string;
  uploadedAt: Date;
}

export interface Payment {
  id: string;
  mainScopeId: string;
  mainScopeName: string;
  subScope: string;
  date: Date;
  receivedEGP: number;
  receivedUSD: number;
  mineEGP: number;
  mineUSD: number;
  others: PaymentSplit[];
  godAmount: number;
  godPercentage: number;
  notes?: string;
  attachments: PaymentAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GodsMoney {
  id: string;
  responsibleTo: string;
  title: string;
  description?: string;
  priceEGP: number;
  proof?: string;
  sendingDate: Date;
  executionDate: Date;
  notes?: string;
  attachments: PaymentAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  baseSalary: number;
  weekend?: string;
  paymentMethod?: string;
  accountNumber?: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  date: Date;
  amount: number;
  comments?: string;
  notes?: string;
  attachments: PaymentAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'viewer';
  createdAt: Date;
}

export interface DashboardStats {
  totalReceivedEGP: number;
  totalReceivedUSD: number;
  totalMineEGP: number;
  totalMineUSD: number;
  totalGodMoney: number;
  totalGodDisbursed: number;
  godMoneyBalance: number;
  totalSalariesPaid: number;
  projectCount: number;
  employeeCount: number;
}
