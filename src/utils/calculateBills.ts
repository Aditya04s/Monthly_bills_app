import type {
  BillCalculationResult,
  BillLineResult,
  BillPartyInput,
  BillType,
  CalculateBillsInput,
  DiscrepancyAdjustment,
  MoneyAmount,
  NormalizedPartyRatio
} from '../types/calculation';

const INTERNAL_DECIMALS = 3;
const DISPLAY_DECIMALS = 2;
const RATIO_DECIMALS = 6;

const billDefinitions: Array<{
  type: BillType;
  label: string;
  inputKey: keyof Pick<CalculateBillsInput, 'waterBillAmount' | 'electricityBillAmount'>;
}> = [
  {
    type: 'water',
    label: 'Water Bill',
    inputKey: 'waterBillAmount'
  },
  {
    type: 'electricity',
    label: 'Electricity Bill',
    inputKey: 'electricityBillAmount'
  }
];

interface AmountAllocation {
  partyId: string;
  amount: number;
  eligibleAmount: number;
}

interface AdjustmentResult<TAllocation extends AmountAllocation> {
  allocations: TAllocation[];
  adjustedIndex: number | null;
  discrepancy: number;
}

export function safeRound(value: number, decimals = DISPLAY_DECIMALS): number {
  const factor = 10 ** decimals;
  const sign = Math.sign(value) || 1;
  const rounded = sign * Math.round((Math.abs(value) + Number.EPSILON) * factor) / factor;

  return Object.is(rounded, -0) ? 0 : rounded;
}

export function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: DISPLAY_DECIMALS,
    maximumFractionDigits: DISPLAY_DECIMALS
  }).format(safeRound(value, DISPLAY_DECIMALS));
}

export function formatRatioShare(ratio: number, ratioTotal: number): string {
  if (ratio === 0) {
    return '(0)';
  }

  return `(${formatRatioValue(ratio)}/${formatRatioValue(ratioTotal)})`;
}

export function normalizeRatios(parties: BillPartyInput[], billType: BillType): NormalizedPartyRatio[] {
  if (parties.length === 0) {
    throw new Error('At least one party is required for bill calculation.');
  }

  parties.forEach((party) => {
    billDefinitions.forEach((billDefinition) => {
      const ratio = party.ratios[billDefinition.type];

      if (!Number.isFinite(ratio) || ratio < 0) {
        throw new Error(`Invalid ${billDefinition.label.toLowerCase()} ratio for ${party.name}.`);
      }
    });
  });

  const ratioTotal = parties.reduce((total, party) => total + party.ratios[billType], 0);

  if (ratioTotal <= 0) {
    throw new Error('At least one party must have a positive ratio.');
  }

  const normalizedParties = parties.map((party) => ({
    id: party.id,
    name: party.name,
    billType,
    ratio: party.ratios[billType],
    normalizedRatio: safeRound(party.ratios[billType] / ratioTotal, RATIO_DECIMALS)
  }));
  const normalizedTotal = safeRound(
    normalizedParties.reduce((total, party) => total + party.normalizedRatio, 0),
    RATIO_DECIMALS
  );
  const discrepancy = safeRound(1 - normalizedTotal, RATIO_DECIMALS);

  if (discrepancy === 0) {
    return normalizedParties;
  }

  const adjustmentIndex = findLastEligibleIndex(
    normalizedParties.map((party) => ({
      partyId: party.id,
      amount: party.normalizedRatio,
      eligibleAmount: party.ratio
    })),
    discrepancy,
    RATIO_DECIMALS
  );

  if (adjustmentIndex === null) {
    return normalizedParties;
  }

  return normalizedParties.map((party, index) =>
    index === adjustmentIndex
      ? {
          ...party,
          normalizedRatio: safeRound(party.normalizedRatio + discrepancy, RATIO_DECIMALS)
        }
      : party
  );
}

export function adjustDiscrepancy<TAllocation extends AmountAllocation>(
  allocations: TAllocation[],
  targetTotal: number,
  decimals = DISPLAY_DECIMALS
): AdjustmentResult<TAllocation> {
  const currentTotal = safeRound(
    allocations.reduce((total, allocation) => total + allocation.amount, 0),
    decimals
  );
  const discrepancy = safeRound(targetTotal - currentTotal, decimals);

  if (discrepancy === 0) {
    return {
      allocations,
      adjustedIndex: null,
      discrepancy
    };
  }

  const adjustedIndex = findLastEligibleIndex(allocations, discrepancy, decimals);

  if (adjustedIndex === null) {
    throw new Error('Unable to resolve rounding discrepancy.');
  }

  return {
    allocations: allocations.map((allocation, index) =>
      index === adjustedIndex
        ? {
            ...allocation,
            amount: safeRound(allocation.amount + discrepancy, decimals)
          }
        : allocation
    ),
    adjustedIndex,
    discrepancy
  };
}

export function calculateBills(input: CalculateBillsInput): BillCalculationResult {
  const bills = billDefinitions.map((billDefinition) =>
    calculateBillLine(
      billDefinition.type,
      billDefinition.label,
      normalizeBillAmount(input[billDefinition.inputKey], billDefinition.label),
      normalizeRatios(input.parties, billDefinition.type)
    )
  );

  const parties = input.parties.map((party) => {
    const billShares = bills.map((bill) => {
      const allocation = bill.allocations.find((billAllocation) => billAllocation.partyId === party.id);

      if (!allocation) {
        throw new Error(`Missing allocation for ${party.name}.`);
      }

      return {
        type: bill.type,
        label: bill.label,
        ratio: allocation.ratio,
        ratioTotal: allocation.ratioTotal,
        normalizedRatio: allocation.normalizedRatio,
        amount: allocation.amount
      };
    });
    const total = billShares.reduce((sum, billShare) => sum + billShare.amount.value, 0);

    return {
      partyId: party.id,
      partyName: party.name,
      ratios: party.ratios,
      normalizedRatios: billShares.reduce<Record<BillType, number>>(
        (ratios, billShare) => ({
          ...ratios,
          [billShare.type]: billShare.normalizedRatio
        }),
        {
          water: 0,
          electricity: 0
        }
      ),
      bills: billShares,
      total: toMoneyAmount(total)
    };
  });

  const waterBill = bills.find((bill) => bill.type === 'water');
  const electricityBill = bills.find((bill) => bill.type === 'electricity');

  if (!waterBill || !electricityBill) {
    throw new Error('Bill calculation failed.');
  }

  return {
    input: {
      waterBillAmount: waterBill.amount,
      electricityBillAmount: electricityBill.amount,
      parties: input.parties
    },
    totals: {
      waterBill: waterBill.amount,
      electricityBill: electricityBill.amount,
      combined: toMoneyAmount(waterBill.amount.value + electricityBill.amount.value)
    },
    bills,
    parties,
    adjustments: bills.flatMap((bill) => bill.adjustment ?? []),
    precision: {
      internalDecimals: INTERNAL_DECIMALS,
      displayDecimals: DISPLAY_DECIMALS,
      ratioDecimals: RATIO_DECIMALS
    }
  };
}

function calculateBillLine(
  type: BillType,
  label: string,
  internalTotal: number,
  parties: NormalizedPartyRatio[]
): BillLineResult & { adjustment?: DiscrepancyAdjustment } {
  const internalTarget = safeRound(internalTotal, INTERNAL_DECIMALS);
  const displayTarget = safeRound(internalTarget, DISPLAY_DECIMALS);
  const ratioTotal = parties.reduce((total, party) => total + party.ratio, 0);
  const internalAllocations = parties.map((party) => {
    const rawAmount = internalTarget * party.normalizedRatio;

    return {
      partyId: party.id,
      amount: safeRound(rawAmount, INTERNAL_DECIMALS),
      eligibleAmount: rawAmount
    };
  });
  const adjustedInternalAllocations = adjustDiscrepancy(
    internalAllocations,
    internalTarget,
    INTERNAL_DECIMALS
  ).allocations;
  const displayAllocations = adjustedInternalAllocations.map((allocation) => ({
    ...allocation,
    amount: safeRound(allocation.amount, DISPLAY_DECIMALS)
  }));
  const adjustedDisplayAllocations = adjustDiscrepancy(
    displayAllocations,
    displayTarget,
    DISPLAY_DECIMALS
  );
  const allocations = adjustedDisplayAllocations.allocations.map((allocation, index) => {
    const party = parties[index];

    return {
      partyId: party.id,
      partyName: party.name,
      ratio: party.ratio,
      ratioTotal,
      normalizedRatio: party.normalizedRatio,
      amount: toMoneyAmount(allocation.amount)
    };
  });
  const adjustedAllocation =
    adjustedDisplayAllocations.adjustedIndex === null
      ? null
      : allocations[adjustedDisplayAllocations.adjustedIndex];

  return {
    type,
    label,
    amount: toMoneyAmount(displayTarget),
    allocations,
    adjustment:
      adjustedAllocation && adjustedDisplayAllocations.discrepancy !== 0
        ? {
            billType: type,
            partyId: adjustedAllocation.partyId,
            amount: toMoneyAmount(adjustedDisplayAllocations.discrepancy)
          }
        : undefined
  };
}

function normalizeBillAmount(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number.`);
  }

  return safeRound(value, INTERNAL_DECIMALS);
}

function toMoneyAmount(value: number): MoneyAmount {
  const roundedValue = safeRound(value, DISPLAY_DECIMALS);

  return {
    value: roundedValue,
    formatted: formatInr(roundedValue)
  };
}

function findLastEligibleIndex(
  allocations: AmountAllocation[],
  discrepancy: number,
  decimals: number
): number | null {
  for (let index = allocations.length - 1; index >= 0; index -= 1) {
    const allocation = allocations[index];
    const adjustedAmount = safeRound(allocation.amount + discrepancy, decimals);

    if (allocation.eligibleAmount > 0 && adjustedAmount >= 0) {
      return index;
    }
  }

  return null;
}

function formatRatioValue(value: number): string {
  return Number.isInteger(value) ? String(value) : String(safeRound(value, RATIO_DECIMALS));
}
