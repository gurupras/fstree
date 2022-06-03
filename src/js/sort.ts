import { SortOrder } from './column'
import { Store, StoreEntry } from './store'

const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export type StoreSortFunction<T = any> = (a: StoreEntry<T>, b: StoreEntry<T>, order: SortOrder, store: Store<T>) => number

export const NameSort = <T = any>(keyField: string): StoreSortFunction<T> => {
  const sort = (a: StoreEntry<T>, b: StoreEntry<T>, order: SortOrder, store: Store<T>): number => {
    let first: StoreEntry<T>
    let second: StoreEntry<T>

    if (order === SortOrder.Ascending) {
      first = a
      second = b
    } else {
      first = b
      second = a
    }

    const firstHasChildren = store.hasChildren(store.getId(first))
    const secondHasChildren = store.hasChildren(store.getId(second))

    const nameComparison = nameCollator.compare(first[keyField], second[keyField])
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
  return sort
}

export const SizeSort = <T>(keyField: string, nameField: string): StoreSortFunction<T> => {
  const nameSort = NameSort<T>(nameField)

  const sort = (a: StoreEntry<T>, b: StoreEntry<T>, order: SortOrder, store: Store<T>): number => {
    const aSize = store.hasChildren(a) ? 0 : a[keyField]
    const bSize = store.hasChildren(b) ? 0 : b[keyField]
    if (aSize === bSize) {
      return nameSort(a, b, order, store)
    }
    if (order === SortOrder.Ascending) {
      return aSize - bSize
    } else {
      return bSize - aSize
    }
  }
  return sort
}

export const DateModifiedSort = <T>(keyField: string, nameField: string): StoreSortFunction<T> => {
  const nameSort = NameSort<T>(nameField)

  const sort = (a: StoreEntry<T>, b: StoreEntry<T>, order: SortOrder, store: Store<T>): number => {
    const aLastModified = a[keyField]
    const bLastModified = b[keyField]
    if (aLastModified === bLastModified) {
      return nameSort(a, b, order, store)
    }
    if (order === SortOrder.Ascending) {
      return aLastModified - bLastModified
    } else {
      return bLastModified - aLastModified
    }
  }
  return sort
}
