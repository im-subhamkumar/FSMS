import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { NotFound } from './pages/NotFound';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

// Modular Entry Points for Teams
import StudentsRoot from './modules/Students/pages/index.jsx';
import InstructorsRoot from './modules/Instructors/pages/index.jsx';
import AircraftRoot from './modules/Aircraft/pages/index.jsx';
import FlyingSlotsRoot from './modules/FlyingSlots/pages/index.jsx';
import DispatchBoardRoot from './modules/DispatchBoard/pages/index.jsx';
import MaintenanceBlocksRoot from './modules/MaintenanceBlocks/pages/index.jsx';
import WeatherHoldsRoot from './modules/WeatherHolds/pages/index.jsx';
import CoursesRoot from './modules/Courses/pages/index.jsx';
import QualificationTypesRoot from './modules/QualificationTypes/pages/index.jsx';
import QualificationRecordsRoot from './modules/QualificationRecords/pages/index.jsx';
import DocumentCategoriesRoot from './modules/DocumentCategories/pages/index.jsx';
import DocumentsRoot from './modules/Documents/pages/index.jsx';
import PricingRatesRoot from './modules/PricingRates/pages/index.jsx';
import InvoicesRoot from './modules/Invoices/pages/index.jsx';
import SlotRequestsRoot from './modules/SlotRequests/pages/index.jsx';
import ReportsDashboardRoot from './modules/ReportsDashboard/pages/index.jsx';
import AnalyticsDashboardRoot from './modules/AnalyticsDashboard/pages/index.jsx';
import NotificationsRoot from './modules/Notifications/pages/index.jsx';
import AuditLogsRoot from './modules/AuditLogs/pages/index.jsx';

export const router = createBrowserRouter([
    { path: '/login', element: <Login /> },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <AppShell />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
            { path: 'students/*', element: <StudentsRoot /> },
            { path: 'instructors/*', element: <InstructorsRoot /> },
            { path: 'aircraft/*', element: <AircraftRoot /> },
            { path: 'flying-slots/*', element: <FlyingSlotsRoot /> },
            { path: 'dispatch-board/*', element: <DispatchBoardRoot /> },
            { path: 'maintenance-blocks/*', element: <MaintenanceBlocksRoot /> },
            { path: 'weather-holds/*', element: <WeatherHoldsRoot /> },
            { path: 'courses/*', element: <CoursesRoot /> },
            { path: 'qualification-types/*', element: <QualificationTypesRoot /> },
            { path: 'qualification-records/*', element: <QualificationRecordsRoot /> },
            { path: 'document-categories/*', element: <DocumentCategoriesRoot /> },
            { path: 'documents/*', element: <DocumentsRoot /> },
            { path: 'pricing-rates/*', element: <PricingRatesRoot /> },
            { path: 'invoices/*', element: <InvoicesRoot /> },
            { path: 'slot-requests/*', element: <SlotRequestsRoot /> },
            { path: 'reports-dashboard/*', element: <ReportsDashboardRoot /> },
            { path: 'analytics-dashboard/*', element: <AnalyticsDashboardRoot /> },
            { path: 'notifications/*', element: <NotificationsRoot /> },
            { path: 'audit-logs/*', element: <AuditLogsRoot /> },
            { path: '*', element: <NotFound /> },
        ],
    },
]);
