export type BarListItem = {
  id: string;
  label: string;
  value: number;
  valueLabel: string;
  isHighlighted?: boolean;
};

export type BarListProps = {
  items: BarListItem[];
  ariaLabel: string;
};
