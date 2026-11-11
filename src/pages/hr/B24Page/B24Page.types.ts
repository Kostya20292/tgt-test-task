import type { B24ProcessResultDto, B24TaskDto } from '@shared/api.ts';

export type ProcessResultProps = {
  result: B24ProcessResultDto;
};

export type ProcessedTaskListProps = {
  tasks: B24TaskDto[];
};
