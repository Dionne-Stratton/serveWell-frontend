import RequireAdmin from './RequireAdmin'

export default function ProtectedAdminRoute({ children }) {
  return <RequireAdmin>{children}</RequireAdmin>
}
