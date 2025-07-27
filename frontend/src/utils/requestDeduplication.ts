/**
 * Request deduplication utility to prevent duplicate concurrent API calls
 */

const pendingRequests = new Map<string, Promise<any>>()

export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // If a request with this key is already pending, return the existing promise
  if (pendingRequests.has(key)) {
    console.log(`🔄 Deduplicating request: ${key}`)
    return pendingRequests.get(key)!
  }

  console.log(`🚀 Making new request: ${key}`)
  // Create new request and store it
  const promise = requestFn()
    .finally(() => {
      // Remove from pending requests when completed
      console.log(`✅ Completed request: ${key}`)
      pendingRequests.delete(key)
    })

  pendingRequests.set(key, promise)
  return promise
}

export function clearPendingRequests() {
  pendingRequests.clear()
}
