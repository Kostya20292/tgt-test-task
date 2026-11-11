import type { DepartmentCode } from './domain.ts'

export type ChecklistTemplateItem = {
  title: string
  dueDay: number
}

const COMMON_ITEMS: ChecklistTemplateItem[] = [
  { title: 'Подписать документы и получить пропуск', dueDay: 1 },
  { title: 'Познакомиться с руководителем и командой', dueDay: 1 },
  { title: 'Пройти вводный инструктаж по охране труда', dueDay: 1 },
  { title: 'Познакомиться с наставником', dueDay: 3 },
  { title: 'Пройти вводный онлайн-курс о компании', dueDay: 14 },
  { title: 'Согласовать с руководителем цели на испытательный срок', dueDay: 30 },
]

const DEPARTMENT_ITEMS: Record<DepartmentCode, ChecklistTemplateItem[]> = {
  warehouse: [
    { title: 'Получить спецодежду и обувь', dueDay: 1 },
    { title: 'Обучиться работе с терминалом сбора данных', dueDay: 2 },
    { title: 'Изучить зоны хранения и адресную систему', dueDay: 5 },
    { title: 'Отработать первую смену приёмки с наставником', dueDay: 7 },
    { title: 'Сдать зачёт по технике безопасности на складе', dueDay: 21 },
    { title: 'Отработать самостоятельную смену без замечаний', dueDay: 45 },
  ],
  store: [
    { title: 'Получить форму и бейдж', dueDay: 1 },
    { title: 'Обучиться работе с кассой и возвратами', dueDay: 2 },
    { title: 'Изучить планограмму и зоны магазина', dueDay: 5 },
    { title: 'Пройти тренинг «Как подобрать спортивную обувь»', dueDay: 10 },
    { title: 'Отработать первую самостоятельную смену', dueDay: 21 },
    { title: 'Сдать аттестацию по ассортименту', dueDay: 45 },
  ],
  sales: [
    { title: 'Получить доступ к CRM в Битрикс24', dueDay: 1 },
    { title: 'Изучить прайс и условия для оптовых клиентов', dueDay: 3 },
    { title: 'Послушать 5 звонков опытного менеджера', dueDay: 7 },
    { title: 'Провести первую самостоятельную сделку', dueDay: 21 },
    { title: 'Принять закреплённый пул клиентов', dueDay: 30 },
    { title: 'Выполнить план испытательного срока', dueDay: 75 },
  ],
  office: [
    { title: 'Настроить рабочее место и учётные записи', dueDay: 1 },
    { title: 'Изучить регламенты отдела', dueDay: 3 },
    { title: 'Познакомиться с ключевыми смежными отделами', dueDay: 10 },
    { title: 'Выполнить первую самостоятельную задачу', dueDay: 14 },
    { title: 'Получить промежуточную обратную связь от коллег', dueDay: 45 },
  ],
}

export const getChecklistTemplate = (departmentCode: DepartmentCode): ChecklistTemplateItem[] =>
  [...COMMON_ITEMS, ...DEPARTMENT_ITEMS[departmentCode]].toSorted(
    (first, second) => first.dueDay - second.dueDay,
  )
