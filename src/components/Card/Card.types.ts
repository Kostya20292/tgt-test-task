import type { ReactNode } from 'react';

export type CardProps = {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  tone?: 'default' | 'highlight';
  className?: string;
  children: ReactNode;
};
