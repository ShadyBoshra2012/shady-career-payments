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
  mineEGP: number;
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
  totalMineEGP: number;
  totalGodMoney: number;
  totalGodDisbursed: number;
  godMoneyBalance: number;
  totalSalariesPaid: number;
  projectCount: number;
  employeeCount: number;
}

export type OpsProjectStatus = 'upcoming' | 'running' | 'on-hold' | 'completed' | 'cancelled';
export type OpsProjectPriority = 'low' | 'medium' | 'high';
export type OpsProjectHealth = 'green' | 'yellow' | 'red';
export type OpsMilestoneStatus = 'not-started' | 'in-progress' | 'done' | 'blocked';
export type OpsRiskImpact = 'low' | 'medium' | 'high';
export type OpsRiskStatus = 'open' | 'monitoring' | 'closed';

export interface OpsProjectPayment {
  title: string;
  amountEGP: number;
  dueDate: Date;
  received: boolean;
  receivedDate?: Date;
  notes?: string;
}

export interface OpsProjectMilestone {
  title: string;
  dueDate: Date;
  status: OpsMilestoneStatus;
  ownerEmployeeId?: string;
  notes?: string;
}

export interface OpsProjectAssignment {
  employeeId: string;
  employeeName: string;
  role: string;
  allocationPercent: number;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

export interface OpsProjectRisk {
  title: string;
  impact: OpsRiskImpact;
  ownerEmployeeId?: string;
  mitigation?: string;
  status: OpsRiskStatus;
}

export interface OpsProject {
  id: string;
  name: string;
  clientName: string;
  status: OpsProjectStatus;
  priority: OpsProjectPriority;
  health: OpsProjectHealth;
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  contractValueEGP: number;
  description?: string;
  downPayments: OpsProjectPayment[];
  projectPayments: OpsProjectPayment[];
  milestones: OpsProjectMilestone[];
  assignments: OpsProjectAssignment[];
  risks: OpsProjectRisk[];
  communicationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
