import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  BillCalculationResult,
  BillPartyInput,
  BillType,
  PartyBillResult
} from '../types/calculation';
import { DEFAULT_APP_SETTINGS, getAppSettings, saveCalculationHistory } from '../storage';
import { calculateBills, formatRatioShare } from '../utils/calculateBills';

type BillFieldName = 'waterBill' | 'electricityBill';

type BillFormValues = Record<BillFieldName, string>;
type BillFormErrors = Partial<Record<BillFieldName, string>>;

const initialValues: BillFormValues = {
  waterBill: '',
  electricityBill: ''
};

const billFields: Array<{
  name: BillFieldName;
  label: string;
  helperText: string;
  placeholder: string;
}> = [
  {
    name: 'waterBill',
    label: 'Water Bill Amount',
    helperText: 'Monthly water bill in INR',
    placeholder: '0.00'
  },
  {
    name: 'electricityBill',
    label: 'Electricity Bill Amount',
    helperText: 'Monthly electricity bill in INR',
    placeholder: '0.00'
  }
];

function normalizeAmountInput(value: string): string {
  const digitsAndDecimal = value.replace(/[^\d.]/g, '');
  const [whole = '', ...decimalParts] = digitsAndDecimal.split('.');
  const decimal = decimalParts.join('');

  if (decimalParts.length === 0) {
    return whole;
  }

  return `${whole}.${decimal.slice(0, 2)}`;
}

function validateAmount(value: string, label: string): string | undefined {
  if (!value.trim()) {
    return `${label} is required.`;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 'Enter a valid amount.';
  }

  if (numericValue < 0) {
    return 'Amount cannot be negative.';
  }

  return undefined;
}

function validateForm(values: BillFormValues): BillFormErrors {
  return billFields.reduce<BillFormErrors>((errors, field) => {
    const message = validateAmount(values[field.name], field.label);

    if (message) {
      errors[field.name] = message;
    }

    return errors;
  }, {});
}

function getFallbackRatioTotal(parties: BillPartyInput[], billType: BillType): number {
  return parties.reduce((total, party) => total + party.ratios[billType], 0);
}

function formatBillShare(bill: PartyBillResult, parties: BillPartyInput[]): string {
  const ratioTotal = bill.ratioTotal ?? getFallbackRatioTotal(parties, bill.type);

  return `${bill.label} ${formatRatioShare(bill.ratio, ratioTotal)}`;
}

interface AmountInputProps {
  error?: string;
  helperText: string;
  label: string;
  name: BillFieldName;
  onChange: (name: BillFieldName, value: string) => void;
  placeholder: string;
  value: string;
}

function AmountInput({
  error,
  helperText,
  label,
  name,
  onChange,
  placeholder,
  value
}: AmountInputProps) {
  const inputId = useId();
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-semibold text-app-text">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-app-muted">
          INR
        </span>
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperId}
          onChange={(event) => onChange(name, normalizeAmountInput(event.target.value))}
          className="min-h-14 w-full rounded-lg border border-app-border bg-app-elevated py-3 pl-16 pr-4 text-2xl font-semibold tabular-nums text-app-text shadow-sm transition duration-200 placeholder:text-app-muted/60 focus:border-app-accent focus:bg-app-surface focus:outline-none focus:ring-4 focus:ring-app-accent/15"
        />
      </div>
      <p id={helperId} className="text-sm text-app-muted">
        {helperText}
      </p>
      <div className="min-h-5 transition duration-200" aria-live="polite">
        {error ? (
          <p id={errorId} className="text-sm font-medium text-red-600 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CalculatorScreen() {
  const [values, setValues] = useState<BillFormValues>(initialValues);
  const [errors, setErrors] = useState<BillFormErrors>({});
  const [result, setResult] = useState<BillCalculationResult | null>(null);
  const [parties, setParties] = useState<BillPartyInput[]>(DEFAULT_APP_SETTINGS.tenants);
  const resultRows = [
    ['Water Bill', result?.totals.waterBill.formatted ?? 'Not calculated'],
    ['Electricity Bill', result?.totals.electricityBill.formatted ?? 'Not calculated'],
    ['Total Bills', result?.totals.combined.formatted ?? 'Not calculated']
  ];

  useEffect(() => {
    let active = true;

    void getAppSettings()
      .then((settings) => {
        if (active) {
          setParties(settings.tenants);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const handleAmountChange = (name: BillFieldName, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));

    setResult(null);

    if (errors[name]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setResult(null);
      return;
    }

    const nextResult = calculateBills({
      waterBillAmount: Number(values.waterBill),
      electricityBillAmount: Number(values.electricityBill),
      parties
    });

    setResult(nextResult);
    void saveCalculationHistory(nextResult).catch(() => undefined);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <section
        className="rounded-lg border border-app-border bg-app-surface p-4 shadow-sm transition-colors duration-200"
        aria-labelledby="calculator-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="calculator-title" className="text-lg font-semibold">
              Bill Details
            </h2>
            <p className="mt-1 text-sm text-app-muted">
              Enter both bill amounts before calculating.
            </p>
          </div>
          <span className="rounded-md bg-app-accentSoft px-2.5 py-1 text-xs font-bold text-app-accent">
            INR
          </span>
        </div>

        <div className="mt-5 space-y-5">
          {billFields.map((field) => (
            <AmountInput
              key={field.name}
              name={field.name}
              label={field.label}
              helperText={field.helperText}
              placeholder={field.placeholder}
              value={values[field.name]}
              error={errors[field.name]}
              onChange={handleAmountChange}
            />
          ))}
        </div>
      </section>

      <section
        className="rounded-lg border border-app-border bg-app-surface p-4 shadow-sm transition-colors duration-200"
        aria-labelledby="output-title"
      >
        <div>
          <h2 id="output-title" className="text-lg font-semibold">
            Result
          </h2>
          <p className="mt-1 text-sm text-app-muted">
            Calculated only after pressing the button.
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          {resultRows.map(([label, value]) => (
            <div
              key={label}
              className="flex min-h-14 items-center justify-between rounded-lg bg-app-elevated px-4 transition duration-200"
            >
              <span className="text-sm font-medium text-app-muted">{label}</span>
              <span className="text-base font-semibold text-app-text">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          {result ? (
            result.parties.map((party) => (
              <div key={party.partyId} className="rounded-lg bg-app-elevated p-4 transition duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-app-text">{party.partyName}</h3>
                    <p className="mt-1 text-xs text-app-muted">
                      Water {formatRatioShare(party.ratios.water, party.bills[0]?.ratioTotal ?? 0)} / Electricity{' '}
                      {formatRatioShare(party.ratios.electricity, party.bills[1]?.ratioTotal ?? 0)}
                    </p>
                  </div>
                  <span className="text-base font-bold text-app-text">{party.total.formatted}</span>
                </div>

                <div className="mt-3 grid gap-2">
                  {party.bills.map((bill) => (
                    <div key={bill.type} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-app-muted">
                        {formatBillShare(bill, result.input.parties)}
                      </span>
                      <span className="font-semibold text-app-text">{bill.amount.formatted}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg bg-app-elevated p-4 text-sm text-app-muted">
              Tenant and owner shares will appear after calculation.
            </div>
          )}
        </div>
      </section>

      <div className="sticky bottom-24 z-10 rounded-lg border border-app-border bg-app-surface/95 p-2 shadow-soft backdrop-blur transition duration-200">
        <button
          type="submit"
          className="min-h-14 w-full rounded-lg bg-app-accent px-5 text-base font-bold text-white shadow-sm transition duration-200 hover:opacity-95 active:scale-[0.99] dark:text-slate-950"
        >
          Calculate
        </button>
      </div>
    </form>
  );
}
