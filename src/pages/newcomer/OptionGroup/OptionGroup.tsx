import { useId, type ChangeEvent } from 'react';
import type { OptionGroupProps } from './OptionGroup.types.ts';
import styles from './OptionGroup.module.scss';

export const OptionGroup = <Value extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
  error,
}: OptionGroupProps<Value>) => {
  const errorId = useId();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = options.find((option) => String(option.value) === event.target.value);
    if (selected) onChange(selected.value);
  };

  return (
    <fieldset
      className={styles.group}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              className={styles.input}
            />
            <span className={styles.text}>
              <span className={styles.label}>{option.label}</span>
              {option.caption && <span className={styles.caption}>{option.caption}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </fieldset>
  );
};
