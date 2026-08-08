import { API_BASE_URL as BASE } from '../config/api.js';

const API_BASE_URL = `${BASE}/products`;

export const getSellerProducts = async (token) => {
  const response = await fetch(`${API_BASE_URL}/seller`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch products');
  }
  return data.products;
};

export const createProduct = async (productData, token) => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create product');
  }
  return data;
};

export const updateProduct = async (id, productData, token) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update product');
  }
  return data;
};

export const deleteProduct = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete product');
  }
  return data;
};
