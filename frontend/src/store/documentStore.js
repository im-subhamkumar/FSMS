import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useDocumentStore = create((set, get) => ({
    documents: [],
    documentVersions: [],
    isLoading: false,
    error: null,
    
    fetchDocuments: async (filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            const queryParams = new URLSearchParams(
                Object.entries(filters).filter(([_, v]) => v)
            ).toString();
            
            const url = queryParams 
                ? `${API_URL}/documents?${queryParams}` 
                : `${API_URL}/documents`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch documents');
            
            const data = await response.json();
            set({ documents: data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchDocumentVersions: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/documents/${id}/versions`);
            if (!response.ok) throw new Error('Failed to fetch document versions');
            
            const data = await response.json();
            set({ documentVersions: data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    
    uploadDocument: async (formData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/documents/upload`, {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload document');
            }
            
            const newDoc = await response.json();
            
            await get().fetchDocuments();
            return newDoc;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteDocument: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/documents/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete document');
            
            set(state => ({
                documents: state.documents.filter(doc => doc.id !== id),
                isLoading: false
            }));
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    }
}));
