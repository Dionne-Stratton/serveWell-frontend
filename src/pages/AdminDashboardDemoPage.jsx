import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'
import AdminDashboardPage from './AdminDashboardPage'

export default function AdminDashboardDemoPage() {
  return (
    <AdminDashboardPage organizationSlug={DEMO_ORGANIZATION_SLUG} demoMode />
  )
}
