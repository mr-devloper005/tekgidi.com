import { generateMarketplaceDetailMetadata, MarketplaceDetailRoute } from '@/editable/pages/MarketplacePages'

export const revalidate = 3

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  return generateMarketplaceDetailMetadata('profile', params)
}

export default async function ProfileDetailPage({ params }: { params: Promise<{ username: string }> }) {
  return <MarketplaceDetailRoute task="profile" params={params} />
}
