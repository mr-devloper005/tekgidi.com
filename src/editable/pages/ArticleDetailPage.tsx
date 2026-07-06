import { EditorialDetailRoute, generateEditorialDetailMetadata } from '@/editable/pages/EditorialPages'

export const revalidate = 3

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return generateEditorialDetailMetadata(params)
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <EditorialDetailRoute params={params} />
}
