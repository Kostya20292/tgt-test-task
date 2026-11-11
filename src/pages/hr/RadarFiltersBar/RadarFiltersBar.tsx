import { useId, type ChangeEvent } from 'react';
import { RISK_LEVEL_LABELS, type RiskLevel } from '@shared/risk.ts';
import { Button } from '@/components/Button/Button.tsx';
import { SelectField } from '@/components/SelectField/SelectField.tsx';
import type { RadarFiltersBarProps } from './RadarFiltersBar.types.ts';
import styles from './RadarFiltersBar.module.scss';

const RISK_OPTION_LEVELS: RiskLevel[] = ['high', 'medium', 'low'];

export const RadarFiltersBar = ({
  meta,
  filters,
  isResetVisible,
  onChange,
  onReset,
}: RadarFiltersBarProps) => {
  const searchId = useId();

  const departmentOptions = [
    { value: '', label: 'Все подразделения' },
    ...meta.departments.map((department) => ({ value: department.code, label: department.name })),
  ];

  const riskOptions = [
    { value: '', label: 'Любой риск' },
    ...RISK_OPTION_LEVELS.map((level) => ({ value: level, label: RISK_LEVEL_LABELS[level] })),
  ];

  const managerOptions = [
    { value: '', label: 'Все руководители' },
    ...meta.managers.map((manager) => ({ value: String(manager.id), label: manager.fullName })),
  ];

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) =>
    onChange('search', event.target.value);
  const handleDepartmentChange = (value: string) => onChange('departmentCode', value);
  const handleRiskChange = (value: string) => onChange('riskLevel', value);
  const handleManagerChange = (value: string) => onChange('managerId', value);

  return (
    <search className={styles.bar}>
      <div className={styles.search}>
        <label htmlFor={searchId} className={styles.label}>
          Поиск
        </label>
        <input
          id={searchId}
          type="search"
          className={styles.input}
          placeholder="Имя, должность или точка"
          value={filters.search}
          onChange={handleSearchChange}
          autoComplete="off"
        />
      </div>
      <SelectField
        label="Подразделение"
        value={filters.departmentCode}
        options={departmentOptions}
        onChange={handleDepartmentChange}
      />
      <SelectField
        label="Риск"
        value={filters.riskLevel}
        options={riskOptions}
        onChange={handleRiskChange}
      />
      <SelectField
        label="Руководитель"
        value={filters.managerId}
        options={managerOptions}
        onChange={handleManagerChange}
      />
      {isResetVisible && (
        <div className={styles.reset}>
          <Button variant="ghost" size="s" onClick={onReset}>
            Сбросить фильтры
          </Button>
        </div>
      )}
    </search>
  );
};
