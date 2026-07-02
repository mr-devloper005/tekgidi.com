import { MarketplaceArchiveRoute, marketplaceTaskMetadata } from '@/editable/pages/MarketplacePages'

export const revalidate = 3

export const generateMetadata = () => marketplaceTaskMetadata('classified', '/classified')

export async function ClassifiedPageTaskPage({
  searchParams,
  basePath = '/classified',
}: {
  searchParams?: Promise<{ category?: string; page?: string }>
  basePath?: string
}) {
  return <MarketplaceArchiveRoute task="classified" searchParams={searchParams} basePath={basePath} />
}

export default ClassifiedPageTaskPage

export const ClassifiedTaskPage = ClassifiedPageTaskPage
