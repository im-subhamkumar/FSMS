import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
    persist(
        (set) => ({
    // User Session
    user: null,
    token: null,
    login: (user, token) => set({ user, token }),
    logout: () => set({ user: null, token: null }),

    // Notification System
    notifications: [
        { id: 1, title: 'New Registration', message: 'Trainee John Doe registered.', time: '5m ago', unread: true },
        { id: 2, title: 'Flight Alert', message: 'Weather warning for Session #42.', time: '1h ago', unread: true },
        { id: 3, title: 'System Update', message: 'Maintenance scheduled for tonight.', time: '2h ago', unread: false },
    ],
    addNotification: (notification) =>
        set((state) => ({
            notifications: [
                { id: Date.now(), ...notification },
                ...state.notifications,
            ],
        })),
    removeNotification: (id) =>
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        })),
    markAllRead: () =>
        set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, unread: false })),
        })),

    // Global UI State
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    // Theme Engine
    theme: 'light',
    toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

    // Cross-module Event Bus payload
    eventPayload: null,
    emitEvent: (eventName, data) => set({ eventPayload: { eventName, data, timestamp: Date.now() } }),
        }),
        {
            name: 'fsms-global-storage',
            partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen, user: state.user, token: state.token }),
        }
    )
);
