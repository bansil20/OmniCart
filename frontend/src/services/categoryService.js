import { API_BASE_URL as BASE } from '../config/api.js';

const API_BASE_URL = `${BASE}/categories`;

export const getCategories = async (token) => {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(API_BASE_URL, { headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch categories');
  }
  return data.categories;
};

export const createCategory = async (categoryData, token) => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(categoryData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create category');
  }
  return data;
};

export const updateCategory = async (id, categoryData, token) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(categoryData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update category');
  }
  return data;
};

export const deleteCategory = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete category');
  }
  return data;
};
