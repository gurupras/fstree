export const generateLastModified = () => Date.now() - (Math.random() * 1e12)

export interface CommonEventdata {
  shiftKey?: boolean
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
}

export interface MouseEventData extends CommonEventdata {
  [key: string]: any
}

export function fakeMouseEvent (data: MouseEventData = {}): any {
  return {
    shiftKey: data.shiftKey || false,
    altKey: data.altKey || false,
    ctrlKey: data.ctrlKey || false,
    metaKey: data.metaKey || false
  }
}

export interface KeyboardEventData extends CommonEventdata {
  key: string
  [key: string]: any
}

export function fakeKeyboardEvent (data: KeyboardEventData): any {
  return {
    key: data.key,
    shiftKey: data.shiftKey || false,
    altKey: data.altKey || false,
    ctrlKey: data.ctrlKey || false,
    metaKey: data.metaKey || false
  }
}
