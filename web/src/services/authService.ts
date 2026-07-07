/**
 * Authentication service - API calls for login, register, profile management.
 * REQ-001, REQ-002 from SPEC-0006.
 */

import { API_BASE_URL } from '../api';
import type { AuthResponse, UserProfile, LoginRequest, RegisterRequest } from '../types/auth';

const API_URL = `${API_BASE_URL}/auth`;

/**
 * Send login request to backend.
 */
export const loginUser = async (request: LoginRequest): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }

  return response.json();
};

/**
 * Send register request to backend.
 */
export const registerUser = async (request: RegisterRequest): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Registration failed');
  }

  return response.json();
};

/**
 * Get user profile by ID.
 */
export const getUserProfile = async (userId: string, token: string): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
};

/**
 * Update user profile.
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>,
  token: string
): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  return response.json();
};
