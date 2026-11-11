import { useState } from 'react';
import { getErrorMessage } from '@/api/client.ts';
import { useAssignMentor } from '@/api/hooks.ts';
import { Button } from '@/components/Button/Button.tsx';
import { Card } from '@/components/Card/Card.tsx';
import { SelectField } from '@/components/SelectField/SelectField.tsx';
import { toPhoneHref } from '@/lib/format.ts';
import type { MentorCardProps } from './MentorCard.types.ts';
import styles from './MentorCard.module.scss';

const NO_MENTOR_VALUE = '';

export const MentorCard = ({ newcomer, viewer }: MentorCardProps) => {
  const assignMutation = useAssignMentor(newcomer.id, viewer);
  const [selectedValue, setSelectedValue] = useState(
    newcomer.mentor ? String(newcomer.mentor.id) : NO_MENTOR_VALUE,
  );

  const currentValue = newcomer.mentor ? String(newcomer.mentor.id) : NO_MENTOR_VALUE;
  const isChanged = selectedValue !== currentValue;
  const canEdit = newcomer.status === 'active';

  const options = [
    { value: NO_MENTOR_VALUE, label: 'Не назначен' },
    ...newcomer.mentorCandidates.map((candidate) => ({
      value: String(candidate.id),
      label: `${candidate.fullName} — ${candidate.position}`,
    })),
  ];

  const handleSave = () => {
    assignMutation.mutate(selectedValue === NO_MENTOR_VALUE ? null : Number(selectedValue));
  };

  return (
    <Card title="Наставник">
      {newcomer.mentor ? (
        <div className={styles.current}>
          <span className={styles.name}>{newcomer.mentor.fullName}</span>
          <span className={styles.position}>{newcomer.mentor.position}</span>
          <a href={toPhoneHref(newcomer.mentor.phone)}>{newcomer.mentor.phone}</a>
        </div>
      ) : (
        <p className={styles.missing}>
          Наставник не назначен. Без него новичку не к кому идти с вопросами.
        </p>
      )}

      {canEdit && (
        <div className={styles.form}>
          <SelectField
            label={newcomer.mentor ? 'Сменить наставника' : 'Назначить наставника'}
            value={selectedValue}
            options={options}
            onChange={setSelectedValue}
          />
          <div>
            <Button
              size="s"
              onClick={handleSave}
              disabled={!isChanged}
              isLoading={assignMutation.isPending}
            >
              Сохранить
            </Button>
          </div>
          {assignMutation.isError && (
            <p className={styles.error} role="alert">
              {getErrorMessage(assignMutation.error)}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
