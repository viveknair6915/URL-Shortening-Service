import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
});

export const shortenUrl = async (url: string) => {
    const response = await api.post('/shorten', { url });
    return response.data;
};

export const getUrlStats = async (shortCode: string) => {
    const response = await api.get(`/shorten/${shortCode}/stats`);
    return response.data;
};

export const deleteUrl = async (shortCode: string) => {
    await api.delete(`/shorten/${shortCode}`);
};

export const updateUrl = async (shortCode: string, url: string) => { // Added updateUrl
    const response = await api.put(`/shorten/${shortCode}`, { url });
    return response.data;
};

// Types
export interface URLResponse {
    url: string;
    short_code: string;
    access_count: number;
    created_at: string;
    updated_at: string;
}
