import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { InstructorList } from './InstructorList';
import { InstructorDetail } from './InstructorDetail';
import { InstructorForm } from '../components/InstructorForm';

export default function InstructorsRoot() {
  return (
    <Routes>
      <Route index element={<InstructorList />} />
      <Route path="new" element={<InstructorForm />} />
      <Route path=":id" element={<InstructorDetail />} />
      <Route path=":id/edit" element={<InstructorForm isEdit />} />
    </Routes>
  );
}
