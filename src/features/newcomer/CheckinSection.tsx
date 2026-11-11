import { useState } from 'react'
import type { CheckinInput, NewcomerPageDto } from '@shared/api.ts'
import { DAY_FORMS, formatCount } from '@shared/text.ts'
import { useSubmitCheckin } from '@/api/hooks.ts'
import { Card } from '@/components/Card/Card.tsx'
import { CheckinForm } from './CheckinForm.tsx'
import styles from './CheckinSection.module.scss'

type CheckinSectionProps = {
  page: NewcomerPageDto
  token: string
}

type SubmittedState = {
  wantsHr: boolean
}

const getWaitingText = ({ checkin, dayNumber }: NewcomerPageDto): string => {
  if (dayNumber < 1) return 'Первый чек-ин откроется в ваш первый рабочий день.'
  return `Следующий чек-ин откроется через ${formatCount(checkin.nextInDays, DAY_FORMS)}.`
}

export const CheckinSection = ({ page, token }: CheckinSectionProps) => {
  const submitMutation = useSubmitCheckin(token)
  const [submitted, setSubmitted] = useState<SubmittedState | null>(null)

  const handleSubmit = (input: CheckinInput) => {
    submitMutation.mutate(input, {
      onSuccess: () => setSubmitted({ wantsHr: input.wantsHr }),
    })
  }

  if (page.checkin.available) {
    return (
      <Card
        title="Как прошла неделя?"
        description="4 коротких вопроса раз в неделю. Честные ответы помогают руководителю и HR вовремя помочь."
        tone="highlight"
      >
        <CheckinForm
          onSubmit={handleSubmit}
          isSubmitting={submitMutation.isPending}
          submitError={submitMutation.error}
        />
      </Card>
    )
  }

  return (
    <Card title="Еженедельный чек-ин">
      <div className={styles.status} role="status">
        {submitted && (
          <p className={styles.thanks}>
            Спасибо, ответы получены!
            {submitted.wantsHr && ' HR свяжется с вами в течение рабочего дня.'}
          </p>
        )}
        <p>{getWaitingText(page)}</p>
      </div>
    </Card>
  )
}
