export type BillType = 'water' | 'electricity';

export interface BillPartyInput {
  id: string;
  name: string;
  ratios: Record<BillType, number>;
}

export interface CalculateBillsInput {
  waterBillAmount: number;
  electricityBillAmount: number;
  parties: BillPartyInput[];
}

export interface MoneyAmount {
  value: number;
  formatted: string;
}

export interface NormalizedPartyRatio {
  id: string;
  name: string;
  billType: BillType;
  ratio: number;
  normalizedRatio: number;
}

export interface BillAllocationResult {
  partyId: string;
  partyName: string;
  ratio: number;
  ratioTotal: number;
  normalizedRatio: number;
  amount: MoneyAmount;
}

export interface BillLineResult {
  type: BillType;
  label: string;
  amount: MoneyAmount;
  allocations: BillAllocationResult[];
}

export interface PartyBillResult {
  type: BillType;
  label: string;
  ratio: number;
  ratioTotal: number;
  normalizedRatio: number;
  amount: MoneyAmount;
}

export interface PartyCalculationResult {
  partyId: string;
  partyName: string;
  ratios: Record<BillType, number>;
  normalizedRatios: Record<BillType, number>;
  bills: PartyBillResult[];
  total: MoneyAmount;
}

export interface DiscrepancyAdjustment {
  billType: BillType;
  partyId: string;
  amount: MoneyAmount;
}

export interface CalculationPrecision {
  internalDecimals: 3;
  displayDecimals: 2;
  ratioDecimals: 6;
}

export interface BillCalculationResult {
  input: {
    waterBillAmount: MoneyAmount;
    electricityBillAmount: MoneyAmount;
    parties: BillPartyInput[];
  };
  totals: {
    waterBill: MoneyAmount;
    electricityBill: MoneyAmount;
    combined: MoneyAmount;
  };
  bills: BillLineResult[];
  parties: PartyCalculationResult[];
  adjustments: DiscrepancyAdjustment[];
  precision: CalculationPrecision;
}
