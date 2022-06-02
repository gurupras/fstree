import NameColumnEntry from '@/components/name-column-entry.vue'
import SizeColumnEntry from '@/components/size-column-entry.vue'
import DateModifiedColumnEntry from '@/components/date-modified-column-entry.vue'
import { Store, StoreEntry } from './store'
import { markRaw } from 'vue'

export enum SortOrder {
  Ascending = 'ascending',
  Descending = 'descending',
  Undefined = 'undefined'
}

export interface Column {
  label: string
  keyField: string
  component: any
  sort(a: StoreEntry, b: StoreEntry, order: SortOrder, store: Store): number
}

const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export const NameColumn: Column = {
  label: 'Name',
  keyField: 'name',
  component: markRaw(NameColumnEntry),
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

    const firstHasChildren = store.hasChildren(store.getId(first))
    const secondHasChildren = store.hasChildren(store.getId(second))

    const nameComparison = nameCollator.compare(first[this.keyField], second[this.keyField])
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
  keyField: 'size',
  component: markRaw(SizeColumnEntry),
  sort (a: StoreEntry, b: StoreEntry, order: SortOrder, store: Store): number {
    const aSize = store.hasChildren(a) ? 0 : a[this.keyField]
    const bSize = store.hasChildren(b) ? 0 : b[this.keyField]
    if (aSize === bSize) {
      return NameColumn.sort(a, b, order, store)
    }
    if (order === SortOrder.Ascending) {
      return aSize - bSize
    } else {
      return bSize - aSize
    }
  }
}

export const DateModifiedColumn: Column = {
  label: 'Date Modified',
  keyField: 'lastModified',
  component: markRaw(DateModifiedColumnEntry),
  sort (a: StoreEntry, b: StoreEntry, order: SortOrder, store: Store): number {
    const aLastModified = a[this.keyField]
    const bLastModified = b[this.keyField]
    if (aLastModified === bLastModified) {
      return NameColumn.sort(a, b, order, store)
    }
    if (order === SortOrder.Ascending) {
      return aLastModified - bLastModified
    } else {
      return bLastModified - aLastModified
    }
  }
}
