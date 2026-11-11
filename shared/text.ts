export type PluralForms = readonly [one: string, few: string, many: string]

export const DAY_FORMS: PluralForms = ['день', 'дня', 'дней']
export const PERSON_FORMS: PluralForms = ['человек', 'человека', 'человек']
export const ITEM_FORMS: PluralForms = ['пункт', 'пункта', 'пунктов']

export const pluralize = (count: number, forms: PluralForms): string => {
  const absolute = Math.abs(count) % 100
  const lastDigit = absolute % 10

  if (absolute > 10 && absolute < 20) return forms[2]
  if (lastDigit === 1) return forms[0]
  if (lastDigit >= 2 && lastDigit <= 4) return forms[1]
  return forms[2]
}

export const formatCount = (count: number, forms: PluralForms): string =>
  `${count} ${pluralize(count, forms)}`

export const getFirstName = (fullName: string): string => fullName.split(' ')[0] ?? fullName
