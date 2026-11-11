import type { NewcomerDetailDto, Viewer } from '@shared/api.ts';
import type { ViewerRole } from '@shared/domain.ts';

export type NewcomerDetailContentProps = {
  newcomer: NewcomerDetailDto;
  viewer: Viewer;
};

export type NewcomerDetailLoaderProps = {
  newcomerId: number;
  viewer: Viewer;
};

export type NewcomerDetailPageProps = {
  role: ViewerRole;
};
