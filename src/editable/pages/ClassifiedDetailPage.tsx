import { generateMarketplaceDetailMetadata, MarketplaceDetailRoute } from '@/editable/pages/MarketplacePages'

export const revalidate = 3

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateMarketplaceDetailMetadata('classified', params)
}

export default async function ClassifiedDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <MarketplaceDetailRoute task="classified" params={params} />
}
