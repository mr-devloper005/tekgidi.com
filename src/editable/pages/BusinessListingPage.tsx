import { DirectoryArchiveRoute, directoryTaskMetadata } from '@/editable/pages/DirectoryPages'

export const revalidate = 3

export const generateMetadata = () => directoryTaskMetadata()

export async function BusinessListingPageTaskPage({
  searchParams,
  basePath = '/listing',
}: {
  searchParams?: Promise<{ category?: string; page?: string }>
  basePath?: string
}) {
  return <DirectoryArchiveRoute searchParams={searchParams} basePath={basePath} />
}

export default BusinessListingPageTaskPage

export const BusinessListingTaskPage = BusinessListingPageTaskPage
