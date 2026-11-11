import { ANSWER_LABELS, MOOD_LABELS, type AnswerLevel } from '@shared/domain.ts';
import { RISK_RULES } from '@shared/risk.ts';
import { Badge } from '@/components/Badge/Badge.tsx';
import type { BadgeTone } from '@/components/Badge/Badge.types.ts';
import { Card } from '@/components/Card/Card.tsx';
import { formatDateTime } from '@/lib/format.ts';
import type { CheckinHistoryCardProps, CheckinRowProps } from './CheckinHistoryCard.types.ts';
import styles from './CheckinHistoryCard.module.scss';

const ANSWER_TONES: Record<AnswerLevel, BadgeTone> = {
  yes: 'success',
  partly: 'neutral',
  no: 'danger',
};

const getMoodTone = (mood: number): BadgeTone => {
  if (mood <= RISK_RULES.lowMoodMax) return 'danger';
  if (mood === 3) return 'warning';
  return 'success';
};

const CheckinRow = ({ checkin }: CheckinRowProps) => (
  <li className={styles.item}>
    <div className={styles.header}>
      <time dateTime={checkin.createdAt} className={styles.date}>
        {formatDateTime(checkin.createdAt)}
      </time>
      {checkin.wantsHr && <Badge tone="info">Просит связаться с HR</Badge>}
    </div>
    <dl className={styles.answers}>
      <div>
        <dt>Самочувствие</dt>
        <dd>
          <Badge tone={getMoodTone(checkin.mood)}>
            {checkin.mood} из 5 · {MOOD_LABELS[checkin.mood]}
          </Badge>
        </dd>
      </div>
      <div>
        <dt>Понятны задачи</dt>
        <dd>
          <Badge tone={ANSWER_TONES[checkin.clarity]}>{ANSWER_LABELS[checkin.clarity]}</Badge>
        </dd>
      </div>
      <div>
        <dt>Хватает помощи</dt>
        <dd>
          <Badge tone={ANSWER_TONES[checkin.support]}>{ANSWER_LABELS[checkin.support]}</Badge>
        </dd>
      </div>
    </dl>
    {checkin.comment && <blockquote className={styles.comment}>{checkin.comment}</blockquote>}
  </li>
);

export const CheckinHistoryCard = ({ newcomer }: CheckinHistoryCardProps) => (
  <Card title="Чек-ины" description="Ответы новичка раз в неделю, новые сверху.">
    {newcomer.checkins.length === 0 ? (
      <p className={styles.empty}>
        {newcomer.dayNumber < 1
          ? 'Новичок ещё не вышел на работу.'
          : 'Новичок ещё не проходил чек-ин.'}
      </p>
    ) : (
      <ol className={styles.list}>
        {newcomer.checkins.map((checkin) => (
          <CheckinRow key={checkin.id} checkin={checkin} />
        ))}
      </ol>
    )}
  </Card>
);
