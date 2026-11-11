import type { ReactNode } from 'react';

export type LoadingStateProps = {
  label?: string;
};

export type ErrorStateProps = {
  error: unknown;
  title?: string;
  onRetry?: () => void;
};

export type EmptyStateProps = {
  title: string;
  children?: ReactNode;
};
