import { Link, useParams } from 'react-router';
import type { Viewer } from '@shared/api.ts';
import type { ViewerRole } from '@shared/domain.ts';
import { STAGE_LABELS } from '@shared/timeline.ts';
import { useNewcomer } from '@/api/hooks.ts';
import { useCurrentManager } from '@/app/managerSelection.ts';
import { Badge } from '@/components/Badge/Badge.tsx';
import { Card } from '@/components/Card/Card.tsx';
import { PageHeader } from '@/components/PageHeader/PageHeader.tsx';
import { RiskBadge } from '@/components/RiskBadge/RiskBadge.tsx';
import { ErrorState, LoadingState } from '@/components/StateViews/StateViews.tsx';
import { formatDate, formatDayProgress } from '@/lib/format.ts';
import { CheckinHistoryCard } from '../CheckinHistoryCard/CheckinHistoryCard.tsx';
import { ChecklistProgressCard } from '../ChecklistProgressCard/ChecklistProgressCard.tsx';
import { CheckpointsCard } from '../CheckpointsCard/CheckpointsCard.tsx';
import { HrContactCard } from '../HrContactCard/HrContactCard.tsx';
import { MentorCard } from '../MentorCard/MentorCard.tsx';
import { RiskFactorList } from '../RiskFactorList/RiskFactorList.tsx';
import type {
  NewcomerDetailContentProps,
  NewcomerDetailLoaderProps,
  NewcomerDetailPageProps,
} from './NewcomerDetailPage.types.ts';
import styles from './NewcomerDetailPage.module.scss';

const HR_VIEWER: Viewer = { role: 'hr' };

const BACK_LINKS: Record<ViewerRole, { to: string; label: string }> = {
  hr: { to: '/hr', label: '← К радару новичков' },
  manager: { to: '/manager', label: '← К моим новичкам' },
};

const NewcomerDetailContent = ({ newcomer, viewer }: NewcomerDetailContentProps) => {
  const backLink = BACK_LINKS[viewer.role];

  return (
    <>
      <title>{`${newcomer.fullName} — Первые 90`}</title>
      <PageHeader
        before={
          <Link to={backLink.to} className={styles.back}>
            {backLink.label}
          </Link>
        }
        title={newcomer.fullName}
        description={
          <>
            {newcomer.position} · {newcomer.department.name} · {newcomer.location.name}
            <br />
            Руководитель: {newcomer.manager.fullName} · выход {formatDate(newcomer.startDate)}
          </>
        }
        actions={
          <div className={styles.badges}>
            {newcomer.status === 'left' ? (
              <Badge tone="neutral">Уволился</Badge>
            ) : (
              <Badge tone="info">
                {formatDayProgress(newcomer.dayNumber)} · {STAGE_LABELS[newcomer.stage]}
              </Badge>
            )}
            <RiskBadge level={newcomer.risk.level} score={newcomer.risk.score} />
          </div>
        }
      />

      <div className={styles.grid}>
        <div className={styles.column}>
          <div className={styles.risk}>
            <Card
              title="Риск и что сделать"
              description="Баллы складываются из прозрачных правил: 2–3 — средний риск, 4 и больше — высокий."
            >
              <RiskFactorList factors={newcomer.risk.factors} variant="detailed" />
            </Card>
          </div>
          <div className={styles.checkpoints}>
            <CheckpointsCard newcomer={newcomer} viewer={viewer} />
          </div>
          <div className={styles.checkins}>
            <CheckinHistoryCard newcomer={newcomer} />
          </div>
        </div>
        <div className={styles.column}>
          {viewer.role === 'hr' && (
            <div className={styles.contact}>
              <HrContactCard newcomer={newcomer} />
            </div>
          )}
          <div className={styles.mentor}>
            <MentorCard key={newcomer.id} newcomer={newcomer} viewer={viewer} />
          </div>
          <div className={styles.checklist}>
            <ChecklistProgressCard newcomer={newcomer} />
          </div>
        </div>
      </div>
    </>
  );
};

const NewcomerDetailLoader = ({ newcomerId, viewer }: NewcomerDetailLoaderProps) => {
  const newcomerQuery = useNewcomer(newcomerId, viewer);

  if (newcomerQuery.isPending) return <LoadingState />;
  if (newcomerQuery.isError) {
    return (
      <>
        <Link to={BACK_LINKS[viewer.role].to}>{BACK_LINKS[viewer.role].label}</Link>
        <ErrorState error={newcomerQuery.error} onRetry={() => void newcomerQuery.refetch()} />
      </>
    );
  }

  return <NewcomerDetailContent newcomer={newcomerQuery.data} viewer={viewer} />;
};

const ManagerNewcomerDetail = ({ newcomerId }: { newcomerId: number }) => {
  const { viewer, metaQuery } = useCurrentManager();

  if (metaQuery.isError)
    return <ErrorState error={metaQuery.error} onRetry={() => void metaQuery.refetch()} />;
  if (!viewer) return <LoadingState />;

  return <NewcomerDetailLoader newcomerId={newcomerId} viewer={viewer} />;
};

export const NewcomerDetailPage = ({ role }: NewcomerDetailPageProps) => {
  const { id } = useParams();
  const newcomerId = Number(id);

  if (role === 'manager') return <ManagerNewcomerDetail newcomerId={newcomerId} />;
  return <NewcomerDetailLoader newcomerId={newcomerId} viewer={HR_VIEWER} />;
};
