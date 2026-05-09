// ─── Storage Service ──────────────────────────────────────
//
// Firebase Cloud Storage wrapper.
// Upload, download, and delete files.
//

import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference,
  UploadResult,
} from 'firebase/storage';
import { storage } from '../lib/firebase';

/**
 * Upload a blob/file to Firebase Storage.
 */
export async function uploadFile(
  path: string,
  file: Blob | Uint8Array,
  metadata?: { contentType?: string },
): Promise<string> {
  const storageRef: StorageReference = ref(storage, path);
  const result: UploadResult = await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(result.ref);
}

/**
 * Upload a base64-encoded string.
 */
export async function uploadBase64(
  path: string,
  base64: string,
  contentType: string = 'image/jpeg',
): Promise<string> {
  const storageRef: StorageReference = ref(storage, path);
  await uploadString(storageRef, base64, 'base64', { contentType });
  return getDownloadURL(storageRef);
}

/**
 * Get the download URL for a stored file.
 */
export async function getFileUrl(path: string): Promise<string> {
  const storageRef: StorageReference = ref(storage, path);
  return getDownloadURL(storageRef);
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef: StorageReference = ref(storage, path);
  await deleteObject(storageRef);
}

/**
 * List all files in a directory.
 */
export async function listFiles(
  path: string,
): Promise<{ name: string; fullPath: string }[]> {
  const storageRef: StorageReference = ref(storage, path);
  const result = await listAll(storageRef);
  return result.items.map((item) => ({
    name: item.name,
    fullPath: item.fullPath,
  }));
}

/**
 * Generate a user-scoped storage path.
 */
export function userStoragePath(
  userId: string,
  folder: string,
  filename: string,
): string {
  return `users/${userId}/${folder}/${filename}`;
}
