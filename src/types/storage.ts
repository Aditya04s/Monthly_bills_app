import type { BillCalculationResult, BillPartyInput, BillType, PartyCalculationResult } from './calculation';

export type StoreName = 'calculation-history' | 'settings';

export interface DatabaseSchema {
  name: string;
  version: number;
  stores: Record<string, StoreName>;
}

export interface CalculationHistoryEntry {
  id: string;
  waterBillAmount: number;
  electricityBillAmount: number;
  partyBreakdowns: PartyCalculationResult[];
  ratios: BillPartyInput[];
  result: BillCalculationResult;
  timestamp: string;
  date: string;
}

export interface TenantSettings {
  id: string;
  name: string;
  phoneNumber: string;
  ratios: Record<BillType, number>;
}

export interface AppSettings {
  key: 'app-settings';
  version: 1;
  tenants: TenantSettings[];
  updatedAt: string;
}

export type AppSettingsInput = Omit<AppSettings, 'key' | 'version' | 'updatedAt'>;
