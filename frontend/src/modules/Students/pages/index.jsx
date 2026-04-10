import { Routes, Route } from "react-router-dom";
import StudentsRoot from "../components/StudentsRoot";
import StudentForm from "../components/StudentForm";
import StudentProfile from "../components/StudentProfile";

export default function StudentsPages() {
  return (
    <Routes>
      <Route index element={<StudentsRoot />} />
      <Route path=":id" element={<StudentProfile />} />
      <Route path="new" element={<StudentForm />} />
      <Route path="edit/:id" element={<StudentForm />} />
    </Routes>
  );
}