import { useId, useState, type ChangeEvent, type FormEvent } from 'react';
import type { CheckinInput } from '@shared/api.ts';
import {
  ANSWER_LABELS,
  ANSWER_LEVELS,
  MOOD_LABELS,
  MOOD_VALUES,
  type AnswerLevel,
  type Mood,
} from '@shared/domain.ts';
import { getErrorMessage } from '@/api/client.ts';
import { Button } from '@/components/Button/Button.tsx';
import { OptionGroup } from '../OptionGroup/OptionGroup.tsx';
import type { OptionGroupOption } from '../OptionGroup/OptionGroup.types.ts';
import type { CheckinDraft, CheckinFormProps, RequiredField } from './CheckinForm.types.ts';
import styles from './CheckinForm.module.scss';

const INITIAL_DRAFT: CheckinDraft = {
  mood: null,
  clarity: null,
  support: null,
  comment: '',
  wantsHr: false,
};

const MOOD_OPTIONS: OptionGroupOption<Mood>[] = MOOD_VALUES.map((value) => ({
  value,
  label: String(value),
  caption: MOOD_LABELS[value],
}));

const ANSWER_OPTIONS: OptionGroupOption<AnswerLevel>[] = ANSWER_LEVELS.map((value) => ({
  value,
  label: ANSWER_LABELS[value],
}));

const REQUIRED_FIELD_ERRORS: Record<RequiredField, string> = {
  mood: 'Оцените самочувствие от 1 до 5',
  clarity: 'Выберите ответ про задачи',
  support: 'Выберите ответ про помощь',
};

const getMissingFields = (draft: CheckinDraft): RequiredField[] =>
  (Object.keys(REQUIRED_FIELD_ERRORS) as RequiredField[]).filter((field) => draft[field] === null);

const toCheckinInput = (draft: CheckinDraft): CheckinInput | null => {
  if (draft.mood === null || draft.clarity === null || draft.support === null) return null;
  return {
    mood: draft.mood,
    clarity: draft.clarity,
    support: draft.support,
    comment: draft.comment.trim(),
    wantsHr: draft.wantsHr,
  };
};

export const CheckinForm = ({ onSubmit, isSubmitting, submitError }: CheckinFormProps) => {
  const [draft, setDraft] = useState<CheckinDraft>(INITIAL_DRAFT);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const commentId = useId();
  const commentHintId = useId();
  const hrHintId = useId();

  const missingFields = hasTriedSubmit ? getMissingFields(draft) : [];

  const updateDraft = <Field extends keyof CheckinDraft>(
    field: Field,
    value: CheckinDraft[Field],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const getFieldError = (field: RequiredField): string | undefined =>
    missingFields.includes(field) ? REQUIRED_FIELD_ERRORS[field] : undefined;

  const handleMoodChange = (value: Mood) => updateDraft('mood', value);
  const handleClarityChange = (value: AnswerLevel) => updateDraft('clarity', value);
  const handleSupportChange = (value: AnswerLevel) => updateDraft('support', value);

  const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    updateDraft('comment', event.target.value);
  };

  const handleWantsHrChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateDraft('wantsHr', event.target.checked);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasTriedSubmit(true);

    const input = toCheckinInput(draft);
    if (!input) return;

    onSubmit(input);
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
      aria-label="Еженедельный чек-ин"
    >
      <OptionGroup
        legend="Как вы себя чувствуете на работе на этой неделе?"
        name="mood"
        options={MOOD_OPTIONS}
        value={draft.mood}
        onChange={handleMoodChange}
        error={getFieldError('mood')}
      />
      <OptionGroup
        legend="Понятно, что от вас ждут?"
        name="clarity"
        options={ANSWER_OPTIONS}
        value={draft.clarity}
        onChange={handleClarityChange}
        error={getFieldError('clarity')}
      />
      <OptionGroup
        legend="Хватает помощи от наставника и коллег?"
        name="support"
        options={ANSWER_OPTIONS}
        value={draft.support}
        onChange={handleSupportChange}
        error={getFieldError('support')}
      />

      <div className={styles.field}>
        <label htmlFor={commentId} className={styles.label}>
          Хотите что-то добавить? <span className={styles.optional}>необязательно</span>
        </label>
        <textarea
          id={commentId}
          className={styles.textarea}
          rows={3}
          maxLength={1000}
          value={draft.comment}
          onChange={handleCommentChange}
          aria-describedby={commentHintId}
        />
        <p id={commentHintId} className={styles.hint}>
          Комментарий увидят руководитель и HR. Если отметите «Хочу поговорить с HR» — только HR.
        </p>
      </div>

      <label className={styles.hrOption}>
        <input
          type="checkbox"
          checked={draft.wantsHr}
          onChange={handleWantsHrChange}
          aria-describedby={hrHintId}
          className={styles.checkbox}
        />
        <span>
          <span className={styles.hrTitle}>Хочу поговорить с HR</span>
          <span id={hrHintId} className={styles.hint}>
            Это увидит только HR, не руководитель. HR свяжется с вами в течение рабочего дня.
          </span>
        </span>
      </label>

      {missingFields.length > 0 && (
        <p className={styles.formError} role="alert">
          Ответьте, пожалуйста, на все три вопроса — это займёт полминуты.
        </p>
      )}
      {Boolean(submitError) && (
        <p className={styles.formError} role="alert">
          {getErrorMessage(submitError)}
        </p>
      )}

      <div>
        <Button type="submit" isLoading={isSubmitting}>
          Отправить ответы
        </Button>
      </div>
    </form>
  );
};
