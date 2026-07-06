import { MarketplaceArchiveRoute, marketplaceTaskMetadata } from '@/editable/pages/MarketplacePages'

export const revalidate = 3

export const generateMetadata = () => marketplaceTaskMetadata('profile', '/profile')

export async function ProfilePageTaskPage({
  searchParams,
  basePath = '/profile',
}: {
  searchParams?: Promise<{ category?: string; page?: string }>
  basePath?: string
}) {
  return <MarketplaceArchiveRoute task="profile" searchParams={searchParams} basePath={basePath} />
}

export default ProfilePageTaskPage

export const ProfileTaskPage = ProfilePageTaskPage
