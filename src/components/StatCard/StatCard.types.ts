import type { ReactNode } from 'react';

export type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'danger' | 'warning' | 'accent';
};

export type StatGridProps = {
  children: ReactNode;
};
