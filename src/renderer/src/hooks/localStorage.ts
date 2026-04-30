import { Manifest } from '@shared/types'

export const setItem = (key: string, value: Manifest): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(error)
  }
}

export const getItem = (key: string): Manifest | null => {
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error(error)
  }
  return null
}
