import { MergeExclusive } from 'type-fest'

interface ExpandOnRowClick {
  expandOnRowClick?: boolean
}

interface ChangeDirectoryOnDoubleClick {
  changeDirectoryOnDoubleClick?: boolean
}

type ExclusiveClickConfig = MergeExclusive<ExpandOnRowClick, ChangeDirectoryOnDoubleClick>

export type FSTreeConfig = ExclusiveClickConfig

export const Defaults: FSTreeConfig = {
  expandOnRowClick: true
}
