import type { Metadata } from 'next'
import { AccountManagementClient } from './account-client'

export const metadata: Metadata = {
  title: 'Account Management',
}

export default function AccountManagementPage() {
  return <AccountManagementClient />
}
