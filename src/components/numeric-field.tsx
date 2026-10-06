"use client";

import { parseAmount } from "@/lib/calculations";

export function NumericField({
  id,
  label,
  hint,
  value,
  onChange,
  suffix = "R$",
  optional = false,
  min = 0,
  max = 1e9,
  integer = false,
  required = false,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  optional?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
  required?: boolean;
}) {
  const number = parseAmount(value);
  const invalid = value.trim()
    ? number === null ||
      number < min ||
      number > max ||
      (integer && !Number.isInteger(number))
    : false;
  const error = integer
    ? `Informe um número inteiro entre ${min.toLocaleString("pt-BR")} e ${max.toLocaleString("pt-BR")}.`
    : `Informe um número entre ${min.toLocaleString("pt-BR", { maximumFractionDigits: 6 })} e ${max.toLocaleString("pt-BR")}.`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {optional && <span>opcional</span>}
      </label>
      <div className={`input-wrap ${invalid ? "invalid" : ""}`}>
        <input
          id={id}
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0,00"
          aria-required={required}
          aria-invalid={invalid}
          aria-describedby={`${id}-help`}
        />
        <span aria-hidden="true">{suffix}</span>
      </div>
      <p id={`${id}-help`} className={invalid ? "field-error" : "field-help"}>
        {invalid ? error : hint || " "}
      </p>
    </div>
  );
}
