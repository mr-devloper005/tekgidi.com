import { EditorialArchiveRoute, editorialTaskMetadata } from '@/editable/pages/EditorialPages'

export const revalidate = 3

export const generateMetadata = () => editorialTaskMetadata()

export async function ArticlePageTaskPage({
  searchParams,
  basePath,
}: {
  searchParams?: Promise<{ category?: string; page?: string }>
  basePath?: string
}) {
  return <EditorialArchiveRoute searchParams={searchParams} basePath={basePath} />
}

export default ArticlePageTaskPage

export const ArticleTaskPage = ArticlePageTaskPage
