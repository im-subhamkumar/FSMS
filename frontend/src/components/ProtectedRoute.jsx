import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export const ProtectedRoute = ({ children }) => {
    const { user, token } = useAppStore();
    const location = useLocation();

    if (!user || !token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
};
