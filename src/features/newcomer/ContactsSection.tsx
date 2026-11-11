import type { NewcomerPageDto, PersonDto } from '@shared/api.ts'
import { Card } from '@/components/Card/Card.tsx'
import { toPhoneHref } from '@/lib/format.ts'
import styles from './ContactsSection.module.scss'

type ContactProps = {
  role: string
  person: PersonDto | null
  emptyText?: string
}

const Contact = ({ role, person, emptyText }: ContactProps) => (
  <li className={styles.contact}>
    <span className={styles.role}>{role}</span>
    {person ? (
      <>
        <span className={styles.name}>{person.fullName}</span>
        <span className={styles.position}>{person.position}</span>
        <a href={toPhoneHref(person.phone)} className={styles.phone} aria-label={`Позвонить: ${person.fullName}, ${person.phone}`}>
          {person.phone}
        </a>
      </>
    ) : (
      <span className={styles.empty}>{emptyText}</span>
    )}
  </li>
)

type ContactsSectionProps = {
  page: NewcomerPageDto
}

export const ContactsSection = ({ page }: ContactsSectionProps) => (
  <Card title="К кому обращаться">
    <ul className={styles.list}>
      <Contact role="Наставник" person={page.mentor} emptyText="Пока не назначен — руководитель скоро вас познакомит." />
      <Contact role="Руководитель" person={page.manager} />
      <Contact role="HR" person={page.hr} />
    </ul>
  </Card>
)
