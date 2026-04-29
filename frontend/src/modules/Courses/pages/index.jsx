import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CoursesListPage from './CoursesListPage';

export default function CoursesRoot() {
    return (
        <Routes>
            <Route index element={<CoursesListPage />} />
        </Routes>
    );
}
