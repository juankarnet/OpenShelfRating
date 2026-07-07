/**
 * Catalog service - API calls for book catalog operations.
 * REQ-012 from SPEC-0006 (search catalog in AddBook form).
 */

import { API_BASE_URL } from '../api';
import type { Book } from '../types/library';

const API_URL = `${API_BASE_URL}/catalog`;

/**
 * Search the global book catalog.
 */
export const searchCatalog = async (query: string, token: string): Promise<Book[]> => {
  const params = new URLSearchParams({ search: query });

  const response = await fetch(`${API_URL}/search?${params}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to search catalog');
  }

  return response.json();
};

/**
 * Create a new book in the catalog (if not found during search).
 */
export const createCatalogEntry = async (book: Omit<Book, 'id'>, token: string): Promise<Book> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(book),
  });

  if (!response.ok) {
    throw new Error('Failed to create catalog entry');
  }

  return response.json();
};

/**
 * Get book details by ID.
 */
export const getBook = async (bookId: string, token: string): Promise<Book> => {
  const response = await fetch(`${API_URL}/${bookId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch book details');
  }

  return response.json();
};
