import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PricingRatesListPage from './PricingRatesListPage';

export default function PricingRatesRoot() {
    return (
        <Routes>
            <Route index element={<PricingRatesListPage />} />
        </Routes>
    );
}
