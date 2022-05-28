import NameColumnEntry from '@/components/name-column-entry.vue'
import SizeColumnEntry from '@/components/size-column-entry.vue'
import DateModifiedColumnEntry from '@/components/date-modified-column-entry.vue'
import { Store, StoreEntry } from './store'

export enum SortOrder {
  Ascending = 'ascending',
  Descending = 'descending',
  Undefined = 'undefined'
}

export interface Column {
  label: string
  component: any
  sort(a: StoreEntry, b: StoreEntry, order: SortOrder, store: Store): number
}

const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export const NameColumn: Column = {
  label: 'Name',
  component: NameColumnEntry,
  sort (a: StoreEntry, b: StoreEntry, order: SortOrder, store: Store) {
    let first: StoreEntry
    let second: StoreEntry

    if (order === SortOrder.Ascending) {
      first = a
      second = b
    } else {
      first = b
      second = a
    }

    const firstHasChildren = store.hasChildren[store.getId(first)]
    const secondHasChildren = store.hasChildren[store.getId(second)]

    const nameComparison = nameCollator.compare(first.name, second.name)
    if ((firstHasChildren && secondHasChildren)) {
      return nameComparison
    } else if (firstHasChildren) {
      return -1
    } else if (secondHasChildren) {
      return 1
    } else {
      return nameComparison
    }
  }
}

export const SizeColumn: Column = {
  label: 'Size',
  component: SizeColumnEntry,
  sort (a: StoreEntry, b: StoreEntry, order: SortOrder): number {
    if (order === SortOrder.Ascending) {
      return a.size - b.size
    } else {
      return b.size - a.size
    }
  }
}

export const DateModifiedColumn: Column = {
  label: 'Date Modified',
  component: DateModifiedColumnEntry,
  sort (a: StoreEntry, b: StoreEntry, order: SortOrder): number {
    if (order === SortOrder.Ascending) {
      return a.lastModified - b.lastModified
    } else {
      return b.lastModified - a.lastModified
    }
  }
}
