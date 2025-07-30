// src/utils/apiClient.ts

const BASE_URL = 'http://localhost:3000'; // or your deployed backend

export const apiClient = {
  get: async (endpoint: string) => {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch');
    }
    return response.json();
  },

  post: async (endpoint: string, body: any) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to post');
    }
    return response.json();
  }
};
