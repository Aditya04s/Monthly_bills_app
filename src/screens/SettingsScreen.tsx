import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ThemeSegmentedControl } from '../components/ThemeSegmentedControl';
import {
  DEFAULT_APP_SETTINGS,
  getAppSettings,
  saveAppSettings
} from '../storage';
import type { TenantSettings } from '../types/storage';
import type { ThemeState } from '../types/theme';

interface SettingsScreenProps {
  theme: ThemeState;
}

interface TenantSettingsForm {
  id: string;
  name: string;
  phoneNumber: string;
  waterRatio: string;
  electricityRatio: string;
}

type SettingsErrors = Partial<Record<string, string>>;

function settingsToForm(tenants: TenantSettings[]): TenantSettingsForm[] {
  return tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    phoneNumber: tenant.phoneNumber,
    waterRatio: String(tenant.ratios.water),
    electricityRatio: String(tenant.ratios.electricity)
  }));
}

function formToSettings(form: TenantSettingsForm[]): TenantSettings[] {
  return form.map((tenant) => ({
    id: tenant.id,
    name: tenant.name.trim(),
    phoneNumber: tenant.phoneNumber.trim(),
    ratios: {
      water: Number(tenant.waterRatio),
      electricity: Number(tenant.electricityRatio)
    }
  }));
}

function normalizeRatioInput(value: string): string {
  const digitsAndDecimal = value.replace(/[^\d.]/g, '');
  const [whole = '', ...decimalParts] = digitsAndDecimal.split('.');
  const decimal = decimalParts.join('');

  if (decimalParts.length === 0) {
    return whole;
  }

  return `${whole}.${decimal.slice(0, 3)}`;
}

function validateRatio(value: string, label: string): string | undefined {
  if (!value.trim()) {
    return `${label} is required.`;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 'Enter a valid ratio.';
  }

  if (numericValue < 0) {
    return 'Ratio cannot be negative.';
  }

  return undefined;
}

function validateSettings(form: TenantSettingsForm[]): SettingsErrors {
  const errors: SettingsErrors = {};

  form.forEach((tenant) => {
    if (!tenant.name.trim()) {
      errors[`${tenant.id}.name`] = 'Tenant name is required.';
    }

    const waterMessage = validateRatio(tenant.waterRatio, 'Water ratio');
    const electricityMessage = validateRatio(tenant.electricityRatio, 'Electricity ratio');

    if (waterMessage) {
      errors[`${tenant.id}.waterRatio`] = waterMessage;
    }

    if (electricityMessage) {
      errors[`${tenant.id}.electricityRatio`] = electricityMessage;
    }
  });

  const waterTotal = form.reduce((total, tenant) => total + Number(tenant.waterRatio || 0), 0);
  const electricityTotal = form.reduce(
    (total, tenant) => total + Number(tenant.electricityRatio || 0),
    0
  );

  if (waterTotal <= 0) {
    errors.waterTotal = 'At least one water ratio must be greater than zero.';
  }

  if (electricityTotal <= 0) {
    errors.electricityTotal = 'At least one electricity ratio must be greater than zero.';
  }

  return errors;
}

interface TextInputProps {
  error?: string;
  inputMode?: 'decimal' | 'tel' | 'text';
  label: string;
  onChange: (value: string) => void;
  value: string;
}

function TextInput({ error, inputMode = 'text', label, onChange, value }: TextInputProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-app-text">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        autoComplete="off"
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-lg border border-app-border bg-app-elevated px-3 text-base font-semibold text-app-text shadow-sm transition duration-200 placeholder:text-app-muted/60 focus:border-app-accent focus:bg-app-surface focus:outline-none focus:ring-4 focus:ring-app-accent/15"
      />
      <span className="block min-h-5 text-sm font-medium text-red-600 dark:text-red-300">
        {error ?? ''}
      </span>
    </label>
  );
}

export function SettingsScreen({ theme }: SettingsScreenProps) {
  const [form, setForm] = useState<TenantSettingsForm[]>(
    settingsToForm(DEFAULT_APP_SETTINGS.tenants)
  );
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getAppSettings()
      .then((settings) => {
        if (active) {
          setForm(settingsToForm(settings.tenants));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const updateTenant = (id: string, updates: Partial<TenantSettingsForm>) => {
    setForm((currentForm) =>
      currentForm.map((tenant) => (tenant.id === id ? { ...tenant, ...updates } : tenant))
    );
    setFeedback(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateSettings(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);

    try {
      await saveAppSettings({
        tenants: formToSettings(form)
      });
      setFeedback('Settings saved.');
    } catch {
      setFeedback('Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const defaultForm = settingsToForm(DEFAULT_APP_SETTINGS.tenants);
    setForm(defaultForm);
    setErrors({});
    setSaving(true);

    try {
      await saveAppSettings({
        tenants: formToSettings(defaultForm)
      });
      setFeedback('Settings reset.');
    } catch {
      setFeedback('Unable to reset settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="settings-title">
      <div className="rounded-lg border border-app-border bg-app-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="settings-title" className="text-lg font-semibold">
              Theme
            </h2>
            <p className="text-sm capitalize text-app-muted">{theme.resolvedTheme}</p>
          </div>
        </div>

        <ThemeSegmentedControl mode={theme.mode} onChange={theme.setMode} />
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="rounded-lg border border-app-border bg-app-surface p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Bill Settings</h2>
              <p className="mt-1 text-sm text-app-muted">
                {loading ? 'Loading saved settings' : 'Ratios and contact fields'}
              </p>
            </div>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-app-border px-3 text-sm font-semibold text-app-text transition duration-200 active:scale-[0.99] disabled:opacity-60"
              onClick={handleReset}
              disabled={saving}
            >
              Reset
            </button>
          </div>

          {errors.waterTotal || errors.electricityTotal ? (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium text-red-700 dark:text-red-200">
              {errors.waterTotal ?? errors.electricityTotal}
            </div>
          ) : null}
        </div>

        {form.map((tenant) => (
          <div
            key={tenant.id}
            className="rounded-lg border border-app-border bg-app-surface p-4 shadow-sm"
          >
            <div className="mb-4">
              <h3 className="text-base font-semibold text-app-text">{tenant.name || 'Tenant'}</h3>
            </div>

            <div className="grid gap-3">
              <TextInput
                label="Tenant Name"
                value={tenant.name}
                error={errors[`${tenant.id}.name`]}
                onChange={(value) => updateTenant(tenant.id, { name: value })}
              />
              <TextInput
                label="Phone Number"
                inputMode="tel"
                value={tenant.phoneNumber}
                onChange={(value) => updateTenant(tenant.id, { phoneNumber: value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="Water"
                  inputMode="decimal"
                  value={tenant.waterRatio}
                  error={errors[`${tenant.id}.waterRatio`]}
                  onChange={(value) =>
                    updateTenant(tenant.id, { waterRatio: normalizeRatioInput(value) })
                  }
                />
                <TextInput
                  label="Electricity"
                  inputMode="decimal"
                  value={tenant.electricityRatio}
                  error={errors[`${tenant.id}.electricityRatio`]}
                  onChange={(value) =>
                    updateTenant(tenant.id, { electricityRatio: normalizeRatioInput(value) })
                  }
                />
              </div>
            </div>
          </div>
        ))}

        {feedback ? (
          <div className="rounded-lg bg-app-accentSoft p-3 text-sm font-semibold text-app-accent">
            {feedback}
          </div>
        ) : null}

        <div className="sticky bottom-24 z-10 rounded-lg border border-app-border bg-app-surface/95 p-2 shadow-soft backdrop-blur">
          <button
            type="submit"
            className="min-h-14 w-full rounded-lg bg-app-accent px-5 text-base font-bold text-white shadow-sm transition duration-200 active:scale-[0.99] disabled:opacity-70 dark:text-slate-950"
            disabled={saving}
          >
            {saving ? 'Saving' : 'Save Settings'}
          </button>
        </div>
      </form>
    </section>
  );
}
