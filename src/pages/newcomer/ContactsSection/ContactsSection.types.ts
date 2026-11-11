import type { NewcomerPageDto, PersonDto } from '@shared/api.ts'

export type ContactProps = {
  role: string
  person: PersonDto | null
  emptyText?: string
}

export type ContactsSectionProps = {
  page: NewcomerPageDto
}
