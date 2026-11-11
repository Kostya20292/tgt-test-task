export type OptionGroupOption<Value extends string | number> = {
  value: Value
  label: string
  caption?: string
}

export type OptionGroupProps<Value extends string | number> = {
  legend: string
  name: string
  options: OptionGroupOption<Value>[]
  value: Value | null
  onChange: (value: Value) => void
  error?: string
}
