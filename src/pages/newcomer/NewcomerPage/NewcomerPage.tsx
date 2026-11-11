import { useParams } from 'react-router';
import { PROGRAM_LENGTH_DAYS, STAGE_LABELS } from '@shared/timeline.ts';
import type { NewcomerPageDto } from '@shared/api.ts';
import { ApiError } from '@/api/client.ts';
import { useNewcomerPage } from '@/api/hooks.ts';
import { Card } from '@/components/Card/Card.tsx';
import { ProgressBar } from '@/components/ProgressBar/ProgressBar.tsx';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews/StateViews.tsx';
import { formatDate, formatDateWithWeekday, formatDayProgress } from '@/lib/format.ts';
import { CheckinSection } from '../CheckinSection/CheckinSection.tsx';
import { ChecklistSection } from '../ChecklistSection/ChecklistSection.tsx';
import { ContactsSection } from '../ContactsSection/ContactsSection.tsx';
import { FaqSection } from '../FaqSection/FaqSection.tsx';
import type { NewcomerPageContentProps } from './NewcomerPage.types.ts';
import styles from './NewcomerPage.module.scss';

const getGreetingText = (page: NewcomerPageDto): string => {
  if (page.dayNumber < 1) {
    return `Ваш первый рабочий день — ${formatDateWithWeekday(page.startDate)}. Здесь собрано всё, что поможет спокойно начать.`;
  }
  if (page.dayNumber > PROGRAM_LENGTH_DAYS) {
    return 'Первые 90 дней позади — поздравляем! Страница остаётся с вами как справочник.';
  }
  return 'Здесь ваш план на первые 90 дней, контакты и ответы на частые вопросы.';
};

const NewcomerPageContent = ({ page, token }: NewcomerPageContentProps) => (
  <div className={styles.page}>
    <title>{`${page.firstName}, ваши первые 90 дней — Первые 90`}</title>
    <section className={styles.hero} aria-labelledby="newcomer-title">
      <h1 id="newcomer-title">Привет, {page.firstName}!</h1>
      <p className={styles.role}>
        {page.position} · {page.location.name}
      </p>
      <p className={styles.greeting}>{getGreetingText(page)}</p>
      {page.dayNumber >= 1 && (
        <ProgressBar
          label={STAGE_LABELS[page.stage]}
          value={page.dayNumber}
          max={PROGRAM_LENGTH_DAYS}
          valueText={formatDayProgress(page.dayNumber)}
        />
      )}
    </section>

    <div className={styles.columns}>
      <div className={styles.mainColumn}>
        <CheckinSection page={page} token={token} />
        <ChecklistSection page={page} token={token} />
      </div>
      <div className={styles.sideColumn}>
        {page.nextCheckpoint && (
          <Card title="Ближайшая встреча с руководителем">
            <p className={styles.meetingTitle}>{page.nextCheckpoint.title}</p>
            <p className={styles.meetingDate}>
              {page.nextCheckpoint.status === 'overdue'
                ? `Планировалась на ${formatDate(page.nextCheckpoint.dueDate)} — напомните руководителю`
                : formatDateWithWeekday(page.nextCheckpoint.dueDate)}
            </p>
          </Card>
        )}
        <ContactsSection page={page} />
        <FaqSection items={page.faq} />
      </div>
    </div>
  </div>
);

export const NewcomerPage = () => {
  const { token = '' } = useParams();
  const pageQuery = useNewcomerPage(token);

  if (pageQuery.isPending) return <LoadingState />;

  if (pageQuery.isError) {
    if (pageQuery.error instanceof ApiError && pageQuery.error.status === 404) {
      return (
        <EmptyState title="Страница не найдена">
          <p>Похоже, ссылка устарела или в ней опечатка. Спросите актуальную ссылку у HR.</p>
        </EmptyState>
      );
    }
    return <ErrorState error={pageQuery.error} onRetry={() => void pageQuery.refetch()} />;
  }

  if (pageQuery.data.status === 'left') {
    return (
      <EmptyState title="Страница больше не активна">
        <p>Адаптация по этой ссылке завершена. Если это ошибка — напишите HR.</p>
      </EmptyState>
    );
  }

  return <NewcomerPageContent page={pageQuery.data} token={token} />;
};
