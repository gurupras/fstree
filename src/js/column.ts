import NameColumnEntry from '@/components/name-column-entry.vue'
import SizeColumnEntry from '@/components/size-column-entry.vue'
import DateModifiedColumnEntry from '@/components/date-modified-column-entry.vue'
import { Store, StoreEntry } from './store'
import { markRaw } from 'vue'
import { DateModifiedSort, NameSort, SizeSort } from './sort'

export enum SortOrder {
  Ascending = 'ascending',
  Descending = 'descending',
  Undefined = 'undefined'
}

export interface Column<T = any> {
  label: string
  keyField: string
  component: any
  sort(a: StoreEntry<T>, b: StoreEntry<T>, order: SortOrder, store: Store<T>): number
}

export const NameColumn: Column = {
  label: 'Name',
  keyField: 'name',
  component: markRaw(NameColumnEntry),
  sort: NameSort('name')
}

export const SizeColumn: Column = {
  label: 'Size',
  keyField: 'size',
  component: markRaw(SizeColumnEntry),
  sort: SizeSort('size', 'name')
}

export const DateModifiedColumn: Column = {
  label: 'Date Modified',
  keyField: 'lastModified',
  component: markRaw(DateModifiedColumnEntry),
  sort: DateModifiedSort('lastModified', 'name')
}
