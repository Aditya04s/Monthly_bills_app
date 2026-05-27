import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { clearCalculationHistory, getCalculationHistory } from '../storage';
import type { BillPartyInput, BillType, PartyBillResult } from '../types/calculation';
import type { CalculationHistoryEntry } from '../types/storage';
import { formatRatioShare } from '../utils/calculateBills';

function formatEntryDate(timestamp: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(timestamp));
}

function formatEntryTime(timestamp: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
}

function getFallbackRatioTotal(parties: BillPartyInput[], billType: BillType): number {
  return parties.reduce((total, party) => total + (party.ratios?.[billType] ?? 0), 0);
}

function formatBillShare(bill: PartyBillResult, parties: BillPartyInput[]): string {
  const ratioTotal = bill.ratioTotal ?? getFallbackRatioTotal(parties, bill.type);

  return `${bill.label} ${formatRatioShare(bill.ratio, ratioTotal)}`;
}

function HistoryLoadingState() {
  return (
    <div className="space-y-3" aria-label="Loading history">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-lg border border-app-border bg-app-surface p-4 shadow-sm"
        >
          <div className="animate-pulse space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-app-elevated" />
                <div className="h-3 w-16 rounded bg-app-elevated" />
              </div>
              <div className="h-6 w-20 rounded bg-app-elevated" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 rounded-lg bg-app-elevated" />
              <div className="h-16 rounded-lg bg-app-elevated" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-app-border bg-app-surface p-6 text-center shadow-sm">
      <div
        className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-app-accentSoft text-sm font-bold text-app-accent"
        aria-hidden="true"
      >
        0
      </div>
      <h2 className="text-lg font-semibold">No history yet</h2>
      <p className="mt-2 text-sm leading-6 text-app-muted">
        Completed calculations will appear here after you press Calculate.
      </p>
    </div>
  );
}

interface DeleteConfirmationProps {
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmation({ isDeleting, onCancel, onConfirm }: DeleteConfirmationProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-slate-950/60 px-4 pb-4 backdrop-blur-sm">
      <div
        className="mx-auto w-full max-w-md rounded-lg border border-app-border bg-app-surface p-4 shadow-soft"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-history-title"
      >
        <h2 id="delete-history-title" className="text-lg font-semibold">
          Delete history?
        </h2>
        <p className="mt-2 text-sm leading-6 text-app-muted">
          This removes all saved calculations from this device.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="min-h-12 rounded-lg border border-app-border bg-app-elevated px-4 text-sm font-semibold text-app-text transition duration-200 active:scale-[0.98] disabled:opacity-60"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="min-h-12 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition duration-200 active:scale-[0.98] disabled:opacity-70 dark:bg-red-400 dark:text-slate-950"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface HistoryCardProps {
  entry: CalculationHistoryEntry;
  expanded: boolean;
  onToggle: (id: string) => void;
}

const HistoryCard = memo(function HistoryCard({ entry, expanded, onToggle }: HistoryCardProps) {
  const result = entry.result;
  const date = useMemo(() => formatEntryDate(entry.timestamp), [entry.timestamp]);
  const time = useMemo(() => formatEntryTime(entry.timestamp), [entry.timestamp]);

  return (
    <article className="overflow-hidden rounded-lg border border-app-border bg-app-surface shadow-sm transition duration-200 content-auto">
      <button
        type="button"
        className="block w-full p-4 text-left transition duration-200 active:bg-app-elevated"
        aria-expanded={expanded}
        onClick={() => onToggle(entry.id)}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-app-text">{date}</h2>
            <p className="mt-1 text-sm text-app-muted">{time}</p>
          </div>
          <span className="shrink-0 rounded-md bg-app-accentSoft px-2.5 py-1 text-xs font-bold text-app-accent">
            {result.totals.combined.formatted}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-app-elevated p-3">
            <p className="text-xs text-app-muted">Water</p>
            <p className="mt-1 text-base font-semibold text-app-text">
              {result.totals.waterBill.formatted}
            </p>
          </div>
          <div className="rounded-lg bg-app-elevated p-3">
            <p className="text-xs text-app-muted">Electricity</p>
            <p className="mt-1 text-base font-semibold text-app-text">
              {result.totals.electricityBill.formatted}
            </p>
          </div>
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          {expanded ? (
            <div className="space-y-3 border-t border-app-border px-4 py-4">
              {result.parties.map((party) => (
                <div key={party.partyId} className="rounded-lg bg-app-elevated p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-app-text">{party.partyName}</h3>
                      <p className="mt-1 text-xs text-app-muted">
                        Water {formatRatioShare(party.ratios.water, party.bills[0]?.ratioTotal ?? 0)} / Electricity{' '}
                        {formatRatioShare(party.ratios.electricity, party.bills[1]?.ratioTotal ?? 0)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-app-text">{party.total.formatted}</span>
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
              ))}

              <div className="rounded-lg bg-app-accentSoft p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-app-accent">Final Total</span>
                  <span className="text-base font-bold text-app-accent">
                    {result.totals.combined.formatted}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
});

export function HistoryScreen() {
  const [entries, setEntries] = useState<CalculationHistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const historyEntries = await getCalculationHistory();
      setEntries(historyEntries);
    } catch {
      setError('Unable to load saved history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleToggleEntry = useCallback((id: string) => {
    setExpandedId((currentId) => (currentId === id ? null : id));
  }, []);

  const handleDeleteHistory = useCallback(async () => {
    setDeleting(true);

    try {
      await clearCalculationHistory();
      setEntries([]);
      setExpandedId(null);
      setConfirmingDelete(false);
    } catch {
      setError('Unable to delete history.');
    } finally {
      setDeleting(false);
    }
  }, []);

  return (
    <section className="space-y-4" aria-labelledby="history-title" aria-busy={loading}>
      <div className="rounded-lg border border-app-border bg-app-surface p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="history-title" className="text-lg font-semibold">
              Calculation History
            </h2>
            <p className="mt-1 text-sm leading-6 text-app-muted">{entries.length} saved entries</p>
          </div>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-red-500/40 px-3 text-sm font-semibold text-red-600 transition duration-200 active:scale-[0.98] disabled:opacity-50 dark:text-red-300"
            onClick={() => setConfirmingDelete(true)}
            disabled={entries.length === 0 || loading}
          >
            Delete History
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-700 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? <HistoryLoadingState /> : null}

      {!loading && entries.length === 0 ? <HistoryEmptyState /> : null}

      {!loading && entries.length > 0 ? (
        <div className="space-y-3 pb-2">
          {entries.map((entry) => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={handleToggleEntry}
            />
          ))}
        </div>
      ) : null}

      {confirmingDelete ? (
        <DeleteConfirmation
          isDeleting={deleting}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleDeleteHistory}
        />
      ) : null}
    </section>
  );
}
