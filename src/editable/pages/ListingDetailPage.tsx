import { DirectoryDetailRoute, generateDirectoryDetailMetadata } from '@/editable/pages/DirectoryPages'

export const revalidate = 3

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateDirectoryDetailMetadata(params)
}

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <DirectoryDetailRoute params={params} />
}
