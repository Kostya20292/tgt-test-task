import type { ReactNode } from 'react';
import type { NewcomerListItemDto } from '@shared/api.ts';

export type CellProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

export type RadarRowProps = {
  newcomer: NewcomerListItemDto;
};

export type RadarTableProps = {
  newcomers: NewcomerListItemDto[];
};
