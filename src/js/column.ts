import SizeColumnComponent from '@/components/size-column.vue'
import DateModifiedColumnComponent from '@/components/date-modified-column.vue'

export interface Column {
  label: string
  component: any
}

export const SizeColumn: Column = {
  label: 'Size',
  component: SizeColumnComponent
}

export const DateModifiedColumn: Column = {
  label: 'Date Modified',
  component: DateModifiedColumnComponent
}
