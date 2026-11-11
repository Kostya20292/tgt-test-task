import type { Random } from '../lib/random.ts'

const MALE_FIRST_NAMES = [
  'Алексей', 'Дмитрий', 'Иван', 'Максим', 'Артём', 'Никита', 'Сергей', 'Андрей', 'Егор', 'Кирилл',
  'Михаил', 'Роман', 'Павел', 'Денис', 'Тимур', 'Илья', 'Владислав', 'Олег', 'Руслан', 'Евгений',
]

const FEMALE_FIRST_NAMES = [
  'Анна', 'Мария', 'Екатерина', 'Ольга', 'Дарья', 'Алина', 'Виктория', 'Полина', 'Ксения', 'Наталья',
  'Юлия', 'Елена', 'Софья', 'Татьяна', 'Валерия', 'Ирина', 'Анастасия', 'Кристина',
]

const LAST_NAMES = [
  'Смирнов', 'Попов', 'Васильев', 'Петров', 'Соколов', 'Михайлов', 'Новиков', 'Фёдоров', 'Морозов',
  'Волков', 'Алексеев', 'Лебедев', 'Семёнов', 'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев',
  'Орлов', 'Андреев', 'Макаров', 'Никитин', 'Захаров', 'Зайцев', 'Соловьёв', 'Борисов', 'Яковлев',
  'Григорьев', 'Романов', 'Воробьёв', 'Сергеев', 'Кузьмин', 'Фролов', 'Александров', 'Дмитриев',
  'Королёв', 'Гусев', 'Киселёв', 'Ильин', 'Максимов', 'Поляков', 'Сорокин', 'Виноградов', 'Ковалёв',
  'Медведев', 'Антонов', 'Тарасов', 'Жуков', 'Баранов', 'Филиппов', 'Комаров', 'Давыдов', 'Беляев',
  'Герасимов', 'Богданов', 'Осипов', 'Сидоров', 'Матвеев', 'Титов', 'Марков', 'Крылов', 'Куликов',
  'Карпов', 'Власов', 'Мельников', 'Денисов', 'Гаврилов', 'Тихонов', 'Казаков', 'Афанасьев', 'Данилов',
  'Савельев', 'Тимофеев', 'Фомин', 'Чернов', 'Абрамов', 'Мартынов', 'Ефимов', 'Щербаков', 'Назаров',
]

export type PersonFactory = {
  createFullName: () => string
  createPhone: () => string
}

const formatTwoDigits = (value: number): string => String(value).padStart(2, '0')

export const createPersonFactory = (random: Random, reservedNames: string[] = []): PersonFactory => {
  const usedNames = new Set(reservedNames)

  const buildFullName = (): string => {
    const isFemale = random.chance(0.5)
    const firstName = random.pick(isFemale ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES)
    const lastName = random.pick(LAST_NAMES)
    return `${firstName} ${isFemale ? `${lastName}а` : lastName}`
  }

  const createFullName = (): string => {
    let fullName = buildFullName()
    while (usedNames.has(fullName)) {
      fullName = buildFullName()
    }
    usedNames.add(fullName)
    return fullName
  }

  const createPhone = (): string =>
    `+7 9${random.int(10, 99)} ${random.int(100, 999)}-${formatTwoDigits(random.int(0, 99))}-${formatTwoDigits(random.int(0, 99))}`

  return { createFullName, createPhone }
}
