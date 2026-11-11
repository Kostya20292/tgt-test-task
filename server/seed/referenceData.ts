import type { DepartmentCode } from '../../shared/domain.ts'
import type { WeightedEntry } from '../lib/random.ts'

export type LocationKey = 'warehouse' | 'leninsky' | 'mega' | 'profsoyuznaya' | 'aviapark' | 'office'

export const DEPARTMENTS: { code: DepartmentCode; name: string }[] = [
  { code: 'warehouse', name: 'Склад' },
  { code: 'store', name: 'Розничные магазины' },
  { code: 'sales', name: 'Оптовые продажи' },
  { code: 'office', name: 'Офис' },
]

export const LOCATIONS: { key: LocationKey; name: string }[] = [
  { key: 'warehouse', name: 'Склад, Подольск' },
  { key: 'leninsky', name: 'Магазин на Ленинском проспекте' },
  { key: 'mega', name: 'Магазин в ТЦ «Мега Тёплый Стан»' },
  { key: 'profsoyuznaya', name: 'Магазин на Профсоюзной' },
  { key: 'aviapark', name: 'Магазин в ТЦ «Авиапарк»' },
  { key: 'office', name: 'Офис, Москва' },
]

export type ManagerSeed = {
  fullName: string
  position: string
  phone: string
  departmentCode: DepartmentCode
  locationKey: LocationKey
}

export const MANAGERS: ManagerSeed[] = [
  { fullName: 'Марина Котова', position: 'Директор магазина', phone: '+7 916 210-44-18', departmentCode: 'store', locationKey: 'leninsky' },
  { fullName: 'Игорь Белов', position: 'Начальник смены склада', phone: '+7 903 115-62-90', departmentCode: 'warehouse', locationKey: 'warehouse' },
  { fullName: 'Руслан Хабибуллин', position: 'Начальник смены склада', phone: '+7 925 384-07-51', departmentCode: 'warehouse', locationKey: 'warehouse' },
  { fullName: 'Олег Сафонов', position: 'Директор магазина', phone: '+7 977 502-31-66', departmentCode: 'store', locationKey: 'mega' },
  { fullName: 'Светлана Рябова', position: 'Директор магазина', phone: '+7 915 643-28-04', departmentCode: 'store', locationKey: 'profsoyuznaya' },
  { fullName: 'Денис Журавлёв', position: 'Директор магазина', phone: '+7 926 771-90-35', departmentCode: 'store', locationKey: 'aviapark' },
  { fullName: 'Алексей Громов', position: 'Руководитель отдела оптовых продаж', phone: '+7 985 290-16-73', departmentCode: 'sales', locationKey: 'office' },
  { fullName: 'Наталья Ершова', position: 'Руководитель группы ключевых клиентов', phone: '+7 916 838-52-47', departmentCode: 'sales', locationKey: 'office' },
  { fullName: 'Елена Власенко', position: 'Главный бухгалтер', phone: '+7 903 427-65-12', departmentCode: 'office', locationKey: 'office' },
  { fullName: 'Павел Орешкин', position: 'Руководитель отдела закупок', phone: '+7 925 916-03-28', departmentCode: 'office', locationKey: 'office' },
]

export const HR_CONTACT = {
  fullName: 'Анна Кузнецова',
  position: 'HR-менеджер',
  phone: '+7 916 400-12-34',
}

export const MENTOR_POSITIONS: Record<DepartmentCode, string[]> = {
  warehouse: ['Старший кладовщик', 'Бригадир комплектовщиков', 'Старший водитель погрузчика'],
  store: ['Старший продавец', 'Старший кассир', 'Продавец-консультант'],
  sales: ['Ведущий менеджер по продажам', 'Старший менеджер по работе с клиентами'],
  office: ['Ведущий бухгалтер', 'Старший специалист по закупкам', 'Ведущий специалист'],
}

export const NEWCOMER_POSITIONS: Record<DepartmentCode, string[]> = {
  warehouse: ['Кладовщик', 'Комплектовщик', 'Водитель погрузчика', 'Грузчик'],
  store: ['Продавец-консультант', 'Кассир', 'Продавец-консультант', 'Продавец отдела обуви'],
  sales: ['Менеджер по оптовым продажам', 'Менеджер по работе с клиентами'],
  office: ['Бухгалтер', 'Специалист по закупкам', 'Контент-менеджер', 'Специалист техподдержки'],
}

export const HIRE_DEPARTMENT_WEIGHTS: WeightedEntry<DepartmentCode>[] = [
  ['warehouse', 33],
  ['store', 40],
  ['sales', 15],
  ['office', 12],
]

export const EARLY_LEAVE_DEPARTMENT_WEIGHTS: WeightedEntry<DepartmentCode>[] = [
  ['warehouse', 45],
  ['store', 40],
  ['sales', 10],
  ['office', 5],
]

export const EARLY_LEAVE_REASONS: WeightedEntry<string>[] = [
  ['Ожидания не совпали с реальной работой', 25],
  ['Тяжёлый график и физическая нагрузка', 22],
  ['Не сложились отношения с руководителем или командой', 15],
  ['Не устроила зарплата', 15],
  ['Нашёл другую работу', 13],
]

export const PROBATION_FAILURE_REASON = 'Не прошёл испытательный срок'
export const PROBATION_FAILURE_MIN_DAYS = 45

export const LATE_LEAVE_REASONS: WeightedEntry<string>[] = [
  ['Нашёл другую работу', 35],
  ['Не устроила зарплата', 20],
  ['Переезд', 15],
  ['Личные обстоятельства', 15],
  ['Нет карьерного роста', 15],
]

export const EARLY_LEAVE_DAY_BUCKETS: WeightedEntry<readonly [number, number]>[] = [
  [[1, 7], 30],
  [[8, 21], 30],
  [[22, 45], 22],
  [[46, 89], 18],
]

export const CHECKPOINT_NOTES = [
  'Обсудили задачи на ближайшие недели, вопросов нет.',
  'Всё идёт по плану, наставник доволен.',
  'Нужно больше практики, договорились добавить смены с наставником.',
  'Есть сложности с графиком, обсудили варианты.',
  'Хороший темп, можно давать больше самостоятельности.',
  'Разобрали ошибки первой недели, план понятен.',
]

export const POSITIVE_COMMENTS = [
  'Коллеги помогают, всё понятно.',
  'Нравится команда.',
  'Пока всё хорошо, осваиваюсь.',
  'Наставник очень помогает.',
]

export const SIMULATED_TASK_FIRST_ID = 48_300
export const SEED_TASK_FIRST_ID = 48_200
