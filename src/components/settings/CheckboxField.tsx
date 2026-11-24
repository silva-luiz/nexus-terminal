interface Props {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange(checked: boolean): void;
}

export function CheckboxField({ id, label, hint, checked, onChange }: Props) {
  return (
    <div className="field field--checkbox">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.checked)}
      />
      <div>
        <label htmlFor={id}>{label}</label>
        {hint && (
          <p id={`${id}-hint`} className="field__hint">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
