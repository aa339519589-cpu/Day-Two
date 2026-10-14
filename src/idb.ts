const DB_NAME = 'day-two'
const STORE = 'images'

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function done(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

type StoredImage = { format: 'image-bytes-v1'; bytes: ArrayBuffer; mime: string }

export async function putImage(id: string, blob: Blob) {
  // Read bytes before opening a transaction; awaiting inside it can close it in Safari.
  // ArrayBuffers avoid WebKit's Blob serialization failure in private contexts.
  const value: StoredImage = {
    format: 'image-bytes-v1',
    bytes: await blob.arrayBuffer(),
    mime: blob.type || 'image/jpeg',
  }
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
      tx.objectStore(STORE).put(value, id)
    })
  } finally {
    db.close()
  }
}

export async function getImage(id: string): Promise<Blob | null> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readonly')
    const request = tx.objectStore(STORE).get(id)
    const value = await new Promise<Blob | StoredImage | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
    })
    // Keep photos saved by the previous frontend readable without resetting the database.
    if (value instanceof Blob) return value
    if (value?.format === 'image-bytes-v1' && value.bytes instanceof ArrayBuffer) {
      return new Blob([value.bytes], { type: value.mime })
    }
    return null
  } finally {
    db.close()
  }
}

export async function deleteImage(id: string) {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).delete(id)
  await done(tx)
  db.close()
}

export async function clearImages() {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).clear()
  await done(tx)
  db.close()
}
