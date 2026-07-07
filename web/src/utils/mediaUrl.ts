/**
 * Resolves media paths returned by backend into browser-consumable URLs.
 * Supports absolute URLs and relative object paths (e.g. covers/<bookId>/file.jpg).
 */

const MEDIA_BUCKET_NAME =
  ((import.meta.env.VITE_MEDIA_BUCKET_NAME as string | undefined)?.trim() || 'openshelfrating-media');

const MEDIA_PUBLIC_BASE_URL =
  ((import.meta.env.VITE_MEDIA_PUBLIC_BASE_URL as string | undefined)?.trim() ||
    `${window.location.protocol}//${window.location.hostname}:9000/${MEDIA_BUCKET_NAME}`);

const normalizeAbsoluteUrl = (rawUrl: string): string => {
  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();
    const isInternalMinioHost = hostname === 'minio' || hostname.includes('minio') || hostname.endsWith('.local');

    if (isInternalMinioHost) {
      parsed.hostname = window.location.hostname || 'localhost';
      parsed.port = '9000';
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
};

export const resolveMediaUrl = (value: string | null | undefined): string | undefined => {
  if (!value || !value.trim()) {
    return undefined;
  }

  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return normalizeAbsoluteUrl(trimmed);
  }

  const objectPath = trimmed.replace(/^\/+/, '');
  return `${MEDIA_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${objectPath}`;
};
