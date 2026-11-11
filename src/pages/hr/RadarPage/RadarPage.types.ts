import type { MetaDto, NewcomerListItemDto } from '@shared/api.ts';

export type RadarSummaryProps = {
  newcomers: NewcomerListItemDto[];
};

export type RadarContentProps = {
  meta: MetaDto;
  newcomers: NewcomerListItemDto[];
};
