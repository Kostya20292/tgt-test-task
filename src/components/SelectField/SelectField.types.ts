export type SelectOption = {
  value: string
  label: string
}

export type SelectFieldProps = {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  isLabelHidden?: boolean
  disabled?: boolean
}
