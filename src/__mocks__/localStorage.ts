// Mock localStorage for tests
class MockLocalStorage {
  private store: { [key: string]: string } = {}

  getItem(key: string): string | null {
    return this.store[key] || null
  }

  setItem(key: string, value: string): void {
    this.store[key] = value.toString()
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }

  get length(): number {
    return Object.keys(this.store).length
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store)
    return keys[index] || null
  }
}

export const setupLocalStorageMock = () => {
  global.localStorage = new MockLocalStorage() as Storage
}

export const getLocalStorageData = () => {
  return (global.localStorage as any).store || {}
}

export const clearLocalStorageMock = () => {
  global.localStorage.clear()
}
