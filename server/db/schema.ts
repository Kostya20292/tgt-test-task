import { relations } from 'drizzle-orm'
import { boolean, date, integer, jsonb, pgTable, serial, smallint, text, timestamp } from 'drizzle-orm/pg-core'
import type { B24TaskPayload } from '../../shared/api.ts'
import type {
  AnswerLevel,
  B24TaskType,
  DepartmentCode,
  EmployeeRole,
  Mood,
  NewcomerStatus,
} from '../../shared/domain.ts'
import type { CheckpointDay } from '../../shared/timeline.ts'

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow()
const nullableTimestamp = () => timestamp({ withTimezone: true })

export const departments = pgTable('departments', {
  id: serial().primaryKey(),
  code: text().$type<DepartmentCode>().notNull().unique(),
  name: text().notNull(),
})

export const locations = pgTable('locations', {
  id: serial().primaryKey(),
  name: text().notNull(),
})

export const employees = pgTable('employees', {
  id: serial().primaryKey(),
  fullName: text().notNull(),
  position: text().notNull(),
  phone: text().notNull(),
  role: text().$type<EmployeeRole>().notNull(),
  departmentId: integer().references(() => departments.id),
  locationId: integer().references(() => locations.id),
})

export const newcomers = pgTable('newcomers', {
  id: serial().primaryKey(),
  token: text().notNull().unique(),
  fullName: text().notNull(),
  position: text().notNull(),
  phone: text().notNull(),
  departmentId: integer().notNull().references(() => departments.id),
  locationId: integer().notNull().references(() => locations.id),
  managerId: integer().notNull().references(() => employees.id),
  mentorId: integer().references(() => employees.id),
  startDate: date({ mode: 'string' }).notNull(),
  status: text().$type<NewcomerStatus>().notNull().default('active'),
  hrContactedAt: nullableTimestamp(),
  createdAt: createdAt(),
})

export const checklistItems = pgTable('checklist_items', {
  id: serial().primaryKey(),
  newcomerId: integer()
    .notNull()
    .references(() => newcomers.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  dueDay: smallint().notNull(),
  doneAt: nullableTimestamp(),
})

export const checkpoints = pgTable('checkpoints', {
  id: serial().primaryKey(),
  newcomerId: integer()
    .notNull()
    .references(() => newcomers.id, { onDelete: 'cascade' }),
  day: smallint().$type<CheckpointDay>().notNull(),
  dueDate: date({ mode: 'string' }).notNull(),
  doneAt: nullableTimestamp(),
  note: text(),
})

export const checkins = pgTable('checkins', {
  id: serial().primaryKey(),
  newcomerId: integer()
    .notNull()
    .references(() => newcomers.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
  mood: smallint().$type<Mood>().notNull(),
  clarity: text().$type<AnswerLevel>().notNull(),
  support: text().$type<AnswerLevel>().notNull(),
  comment: text(),
  wantsHr: boolean().notNull().default(false),
})

export const offboardings = pgTable('offboardings', {
  id: serial().primaryKey(),
  newcomerId: integer()
    .notNull()
    .unique()
    .references(() => newcomers.id, { onDelete: 'cascade' }),
  leaveDate: date({ mode: 'string' }).notNull(),
  reason: text().notNull(),
  daysWorked: integer().notNull(),
})

export const b24Tasks = pgTable('b24_tasks', {
  id: serial().primaryKey(),
  externalId: text().notNull().unique(),
  type: text().$type<B24TaskType>().notNull(),
  payload: jsonb().$type<B24TaskPayload>().notNull(),
  createdAt: createdAt(),
  processedAt: nullableTimestamp(),
  newcomerId: integer().references(() => newcomers.id, { onDelete: 'set null' }),
})

export const departmentsRelations = relations(departments, ({ many }) => ({
  newcomers: many(newcomers),
}))

export const employeesRelations = relations(employees, ({ one }) => ({
  department: one(departments, { fields: [employees.departmentId], references: [departments.id] }),
  location: one(locations, { fields: [employees.locationId], references: [locations.id] }),
}))

export const newcomersRelations = relations(newcomers, ({ one, many }) => ({
  department: one(departments, { fields: [newcomers.departmentId], references: [departments.id] }),
  location: one(locations, { fields: [newcomers.locationId], references: [locations.id] }),
  manager: one(employees, {
    fields: [newcomers.managerId],
    references: [employees.id],
    relationName: 'manager',
  }),
  mentor: one(employees, {
    fields: [newcomers.mentorId],
    references: [employees.id],
    relationName: 'mentor',
  }),
  checklistItems: many(checklistItems),
  checkpoints: many(checkpoints),
  checkins: many(checkins),
  offboarding: one(offboardings, { fields: [newcomers.id], references: [offboardings.newcomerId] }),
}))

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  newcomer: one(newcomers, { fields: [checklistItems.newcomerId], references: [newcomers.id] }),
}))

export const checkpointsRelations = relations(checkpoints, ({ one }) => ({
  newcomer: one(newcomers, { fields: [checkpoints.newcomerId], references: [newcomers.id] }),
}))

export const checkinsRelations = relations(checkins, ({ one }) => ({
  newcomer: one(newcomers, { fields: [checkins.newcomerId], references: [newcomers.id] }),
}))

export const offboardingsRelations = relations(offboardings, ({ one }) => ({
  newcomer: one(newcomers, { fields: [offboardings.newcomerId], references: [newcomers.id] }),
}))
