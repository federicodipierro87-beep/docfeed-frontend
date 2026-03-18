import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { Toaster } from '@/components/ui/toaster'

// Pages
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import DocumentsPage from '@/pages/DocumentsPage'
import DocumentDetailPage from '@/pages/DocumentDetailPage'
import VaultsPage from '@/pages/VaultsPage'
import SearchPage from '@/pages/SearchPage'
import TrashPage from '@/pages/TrashPage'
import UsersPage from '@/pages/UsersPage'
import WorkflowsPage from '@/pages/WorkflowsPage'
import AttributesPage from '@/pages/AttributesPage'
import MetadataPage from '@/pages/MetadataPage'
import StructurePage from '@/pages/StructurePage'
import UserGroupsPage from '@/pages/UserGroupsPage'
import SettingsPage from '@/pages/SettingsPage'

// Layout
import MainLayout from '@/components/layout/MainLayout'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Admin Route wrapper (ADMIN e MANAGER)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()

  if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Only Admin Route wrapper (solo ADMIN)
function OnlyAdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:id" element={<DocumentDetailPage />} />
          <Route
            path="vaults"
            element={
              <OnlyAdminRoute>
                <VaultsPage />
              </OnlyAdminRoute>
            }
          />
          <Route
            path="vaults/:id"
            element={
              <OnlyAdminRoute>
                <DocumentsPage />
              </OnlyAdminRoute>
            }
          />
          <Route path="search" element={<SearchPage />} />
          <Route path="trash" element={<TrashPage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Admin routes */}
          <Route
            path="users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="user-groups"
            element={
              <AdminRoute>
                <UserGroupsPage />
              </AdminRoute>
            }
          />
          <Route
            path="workflows"
            element={
              <AdminRoute>
                <WorkflowsPage />
              </AdminRoute>
            }
          />
          <Route
            path="attributes"
            element={
              <AdminRoute>
                <AttributesPage />
              </AdminRoute>
            }
          />
          <Route
            path="metadata"
            element={
              <AdminRoute>
                <MetadataPage />
              </AdminRoute>
            }
          />
          <Route
            path="structure"
            element={
              <AdminRoute>
                <StructurePage />
              </AdminRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </>
  )
}
