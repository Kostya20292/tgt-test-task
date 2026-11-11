import type { CheckinDto, NewcomerDetailDto } from '@shared/api.ts';

export type CheckinRowProps = {
  checkin: CheckinDto;
};

export type CheckinHistoryCardProps = {
  newcomer: NewcomerDetailDto;
};
