import type { CheckinInput } from '@shared/api.ts';
import type { AnswerLevel, Mood } from '@shared/domain.ts';

export type CheckinDraft = {
  mood: Mood | null;
  clarity: AnswerLevel | null;
  support: AnswerLevel | null;
  comment: string;
  wantsHr: boolean;
};

export type RequiredField = 'mood' | 'clarity' | 'support';

export type CheckinFormProps = {
  onSubmit: (input: CheckinInput) => void;
  isSubmitting: boolean;
  submitError: unknown;
};
