import type { NewcomerPageDto } from '@shared/api.ts';

export type CheckinSectionProps = {
  page: NewcomerPageDto;
  token: string;
};

export type SubmittedState = {
  wantsHr: boolean;
};
