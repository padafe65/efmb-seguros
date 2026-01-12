// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register"; // ahora sirve como CreateUser / EditUser
import CreatePolicy from "./pages/CreatePolicy";
import ForgotPassword from "./pages/ForgotPassword";

import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardUser from "./pages/DashboardUser";
import DashboardSuperUser from "./pages/DashboardSuperUser";

import ProtectedRoute from "./routes/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";

export default function App() {
  return (
    <Router>
      <div className="app-layout">
        <Navbar />

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/registrar" element={<Register />} />

            <Route
              path="/dashboard-admin"
              element={
                <ProtectedRoute allowed={["admin"]}>
                  <DashboardAdmin />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard-super"
              element={
                <ProtectedRoute allowed={["super_user"]}>
                  <DashboardSuperUser />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users/create"
              element={
                <ProtectedRoute allowed={["admin", "super_user"]}>
                  <Register />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users/edit/:id"
              element={
                <ProtectedRoute allowed={["admin", "super_user"]}>
                  <Register />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/policies/create"
              element={
                <ProtectedRoute allowed={["admin", "super_user"]}>
                  <CreatePolicy />
                </ProtectedRoute>
              }
            />

            <Route
             path="/admin/policies/edit/:id_policy"
              element={
                <ProtectedRoute allowed={["admin", "super_user"]}>
                  <CreatePolicy mode="edit" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/policies/view/:id"
              element={
                <ProtectedRoute allowed={["admin", "super_user"]}>
                  <CreatePolicy mode="view" />
                </ProtectedRoute>
              }
            />



            <Route
              path="/dashboard-user"
              element={
                <ProtectedRoute allowed={["user"]}>
                  <DashboardUser />
                </ProtectedRoute>
              }
            />
            <Route path="/policy/create" element={<CreatePolicy mode="create" />} />
            <Route path="/policy/view/:id" element={<CreatePolicy mode="view" />} />
            <Route path="/policy/edit/:id" element={<CreatePolicy mode="edit" />} />

          </Routes>
        </main>

        <Footer />
        <ChatWidget />
      </div>
    </Router>
  );
}
