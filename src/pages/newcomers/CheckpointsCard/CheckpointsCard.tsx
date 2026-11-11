import { useId, useState, type ChangeEvent } from 'react';
import { getErrorMessage } from '@/api/client.ts';
import { useUpdateCheckpoint } from '@/api/hooks.ts';
import { Button } from '@/components/Button/Button.tsx';
import { Card } from '@/components/Card/Card.tsx';
import { CheckpointStatusBadge } from '@/components/CheckpointStatusBadge/CheckpointStatusBadge.tsx';
import { formatDate, formatDateTime } from '@/lib/format.ts';
import type {
  CheckpointItemProps,
  CheckpointsCardProps,
  SaveCheckpoint,
} from './CheckpointsCard.types.ts';
import styles from './CheckpointsCard.module.scss';

const CheckpointItem = ({ checkpoint, canEdit, isPending, onSave }: CheckpointItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState('');
  const noteId = useId();

  const handleStartEditing = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    setNote('');
  };

  const handleNoteChange = (event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value);

  const handleSave = () => {
    onSave(checkpoint.id, true, note, handleCancel);
  };

  const handleUndo = () => onSave(checkpoint.id, false, '');

  return (
    <li className={`${styles.item} ${styles[checkpoint.status]}`}>
      <div className={styles.row}>
        <div className={styles.info}>
          <span className={styles.title}>
            День {checkpoint.day}. {checkpoint.title}
          </span>
          <span className={styles.date}>
            {checkpoint.doneAt
              ? `Проведена ${formatDateTime(checkpoint.doneAt)}`
              : `Срок: ${formatDate(checkpoint.dueDate)}`}
          </span>
        </div>
        <CheckpointStatusBadge status={checkpoint.status} />
      </div>

      {checkpoint.note && <p className={styles.note}>{checkpoint.note}</p>}

      {canEdit && !isEditing && (
        <div className={styles.actions}>
          {checkpoint.doneAt ? (
            <Button variant="ghost" size="s" onClick={handleUndo} disabled={isPending}>
              Снять отметку
            </Button>
          ) : (
            <Button variant="secondary" size="s" onClick={handleStartEditing} disabled={isPending}>
              Отметить проведённой
            </Button>
          )}
        </div>
      )}

      {isEditing && (
        <div className={styles.form}>
          <label htmlFor={noteId} className={styles.noteLabel}>
            Итоги встречи <span className={styles.optional}>необязательно</span>
          </label>
          <textarea
            id={noteId}
            className={styles.textarea}
            rows={2}
            maxLength={1000}
            value={note}
            onChange={handleNoteChange}
            autoFocus
          />
          <div className={styles.actions}>
            <Button size="s" onClick={handleSave} isLoading={isPending}>
              Сохранить
            </Button>
            <Button variant="ghost" size="s" onClick={handleCancel}>
              Отмена
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

export const CheckpointsCard = ({ newcomer, viewer }: CheckpointsCardProps) => {
  const updateMutation = useUpdateCheckpoint(newcomer.id, viewer);
  const canEdit = viewer.role === 'manager' && newcomer.status === 'active';

  const handleSave: SaveCheckpoint = (checkpointId, done, note, onSaved) => {
    updateMutation.mutate({ checkpointId, done, note }, { onSuccess: onSaved });
  };

  return (
    <Card
      title="Контрольные встречи"
      description={
        canEdit
          ? 'Короткие встречи один на один. Отмечайте проведённые — просроченная встреча повышает риск.'
          : 'Встречи проводит и отмечает руководитель.'
      }
    >
      {updateMutation.isError && (
        <p className={styles.error} role="alert">
          {getErrorMessage(updateMutation.error)}
        </p>
      )}
      <ol className={styles.list}>
        {newcomer.checkpoints.map((checkpoint) => (
          <CheckpointItem
            key={checkpoint.id}
            checkpoint={checkpoint}
            canEdit={canEdit}
            isPending={updateMutation.isPending}
            onSave={handleSave}
          />
        ))}
      </ol>
    </Card>
  );
};
