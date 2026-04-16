import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import StatCards from '../components/StatCards';
import FleetStatus from '../components/FleetStatus';
import RepairAssignment from '../components/RepairAssignment';
import AlertsList from '../components/AlertsList';
import AssignedRepairOverview from '../components/AssignedRepairOverview';
import ActivityLog from '../components/ActivityLog';
import Modal from '../components/Modal';
import MaintenanceCalendar from '../components/MaintenanceCalendar';
import ExpandedTableView from '../components/ExpandedTableView';
import './maintenance-dashboard.css';

export default function MaintenanceBlocksRoot() {
    const [modalState, setModalState] = useState({ isOpen: false, type: null, title: '' });

    useEffect(() => {
        const handleOpenModal = (event) => {
            setModalState({
                isOpen: true,
                type: event.detail.type,
                title: event.detail.title
            });
        };
        window.addEventListener('open-modal', handleOpenModal);
        return () => window.removeEventListener('open-modal', handleOpenModal);
    }, []);

    const closeModal = () => setModalState({ ...modalState, isOpen: false });

    const renderModalContent = () => {
        switch (modalState.type) {
            case 'calendar': return <MaintenanceCalendar />;
            case 'fleet': return <ExpandedTableView type="fleet" />;
            case 'repairs': return <ExpandedTableView type="repairs" />;
            default: return null;
        }
    };

    return (
        <div className="maintenance-dashboard-root h-full overflow-y-auto">
            <div className="dashboard-container">
                <Header />
                <StatCards />

                <div className="grid-layout">
                    {/* Left Column */}
                    <div className="grid-col">
                        <FleetStatus />
                        <AlertsList />
                    </div>

                    {/* Right Column */}
                    <div className="grid-col">
                        <RepairAssignment />
                        <AssignedRepairOverview />
                    </div>
                </div>

                <ActivityLog />
            </div>
            
            <Modal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title}>
                {renderModalContent()}
            </Modal>
        </div>
    );
}
