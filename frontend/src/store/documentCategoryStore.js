import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

export const useDocumentCategoryStore = create((set, get) => ({
    categories: [],
    isLoading: false,
    error: null,
    
    fetchCategories: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/document-categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            
            const data = await response.json();
            set({ categories: data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    
    createCategory: async (categoryData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/document-categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData)
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create category');
            }
            
            await get().fetchCategories();
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateCategory: async (id, categoryData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/document-categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryData)
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update category');
            }
            
            await get().fetchCategories();
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteCategory: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/document-categories/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete category');
            }
            
            await get().fetchCategories();
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    }
}));
