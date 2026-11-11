import type { ReactNode } from 'react';

export type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  before?: ReactNode;
};
