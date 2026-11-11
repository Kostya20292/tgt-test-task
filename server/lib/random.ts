import { randomBytes } from 'node:crypto'

export type WeightedEntry<Value> = readonly [value: Value, weight: number]

export type Random = {
  next: () => number
  int: (min: number, max: number) => number
  pick: <Value>(items: readonly Value[]) => Value
  chance: (probability: number) => boolean
  weighted: <Value>(entries: readonly WeightedEntry<Value>[]) => Value
}

const TOKEN_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'
const TOKEN_LENGTH = 12

const createMulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

export const createRandom = (seed: number = randomBytes(4).readUInt32LE()): Random => {
  const next = createMulberry32(seed)

  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1))

  const pick = <Value>(items: readonly Value[]): Value => {
    const item = items[int(0, items.length - 1)]
    if (item === undefined) throw new Error('Cannot pick from an empty list')
    return item
  }

  const chance = (probability: number): boolean => next() < probability

  const weighted = <Value>(entries: readonly WeightedEntry<Value>[]): Value => {
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
    let threshold = next() * total
    for (const [value, weight] of entries) {
      threshold -= weight
      if (threshold < 0) return value
    }
    return pick(entries.map(([value]) => value))
  }

  return { next, int, pick, chance, weighted }
}

export const createToken = (random: Random = createRandom()): string =>
  Array.from({ length: TOKEN_LENGTH }, () => random.pick([...TOKEN_ALPHABET])).join('')
