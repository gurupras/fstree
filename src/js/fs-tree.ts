import { RequireExactlyOne } from 'type-fest'

interface PlainFSTreeConfig {
  expandOnRowClick?: boolean
  changeDirectoryOnDoubleClick?: boolean
}

export type FSTreeConfig = RequireExactlyOne<PlainFSTreeConfig, 'expandOnRowClick' | 'changeDirectoryOnDoubleClick'>

export const Defaults: FSTreeConfig = {
  expandOnRowClick: true
}
