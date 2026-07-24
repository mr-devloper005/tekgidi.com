import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, ChevronDown, Globe2, Mail, MapPin, Phone, Shield, Sparkles, Star } from 'lucide-react'
import { buildPostMetadata, buildTaskMetadata } from '@/lib/seo'
import { CATEGORY_OPTIONS, normalizeCategory } from '@/lib/categories'
import { fetchPaginatedTaskPosts, fetchTaskPostBySlug, fetchTaskPosts } from '@/lib/task-data'
import { getTaskConfig } from '@/lib/site-config'
import type { SiteFeedPagination, SitePost } from '@/lib/site-connector'
import { taskPageMetadata } from '@/config/site.content'
import { EditableSiteShell } from '@/editable/shell/EditableSiteShell'
import { taskThemeStyle } from '@/editable/theme/task-themes'
import { Ads } from '@/lib/ads'

export const directoryTaskMetadata = () =>
  buildTaskMetadata('listing', {
    path: '/listing',
    title: taskPageMetadata.listing?.title,
    description: taskPageMetadata.listing?.description,
  })

const getContent = (post: SitePost) => (post.content && typeof post.content === 'object' ? (post.content as Record<string, unknown>) : {})
const asText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const summaryOf = (post: SitePost) => stripHtml(post.summary || asText(getContent(post).description) || asText(getContent(post).excerpt) || '')
const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const safeUrl = (value: string) => (/^https?:\/\//i.test(value) ? value : '#')
const linkifyMarkdown = (value: string) => value.replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/gi, (_m, label, url) => `<a href="${safeUrl(url)}" target="_blank" rel="nofollow noopener noreferrer">${label}</a>`)
const linkifyText = (value: string) => linkifyMarkdown(value).replace(/(^|[\s(>])((https?:\/\/)[^\s<)]+)/gi, (_m, prefix, url) => `${prefix}<a href="${safeUrl(url)}" target="_blank" rel="nofollow noopener noreferrer">${url}</a>`)
const hardenLinks = (html: string) => html.replace(/<a\s+([^>]*href=["'][^"']+["'][^>]*)>/gi, (_m, attrs) => {
  let next = String(attrs).replace(/\s+on\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  if (!/\starget=/i.test(next)) next += ' target="_blank"'
  if (!/\srel=/i.test(next)) next += ' rel="nofollow noopener noreferrer"'
  return `<a ${next}>`
})
const sanitizeHtml = (html: string) => hardenLinks(html
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<(iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '')
  .replace(/\s+on\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/(href|src)=(['"])javascript:[\s\S]*?\2/gi, '$1="#"'))
const formatPlainText = (raw: string) => {
  const value = raw.trim()
  if (!value) return ''
  if (/<[a-z][\s\S]*>/i.test(value)) return sanitizeHtml(linkifyMarkdown(value))
  return value.split(/\n{2,}/).map((part) => `<p>${linkifyText(escapeHtml(part).replace(/\n/g, '<br />'))}</p>`).join('')
}
const fieldOf = (post: SitePost, keys: string[]) => {
  const content = getContent(post)
  for (const key of keys) {
    const value = asText(content[key])
    if (value) return value
  }
  return ''
}
const imageOf = (post: SitePost) => {
  const content = getContent(post)
  const media = Array.isArray(post.media) ? post.media.find((item) => typeof item?.url === 'string' && item.url)?.url : ''
  const images = Array.isArray(content.images) ? content.images.find((item) => typeof item === 'string' && item) : ''
  return media || asText(content.logo) || asText(content.image) || (typeof images === 'string' ? images : '') || '/placeholder.svg?height=900&width=1200'
}
const categoryOf = (post: SitePost) => fieldOf(post, ['category']) || post.tags?.[0] || 'Business'
const bodyOf = (post: SitePost) => asText(getContent(post).body) || asText(getContent(post).description) || post.summary || 'Details will appear here once available.'
const hashStr = (value: string) => {
  let h = 0
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}
const ratingOf = (post: SitePost) => {
  const real = Number(getContent(post).rating)
  if (real >= 1 && real <= 5) return Math.round(real * 10) / 10
  return Math.round((4 + (hashStr(post.slug || post.title || 'x') % 8) / 10) * 10) / 10
}
function pageHref(basePath: string, category: string, page: number) {
  const params = new URLSearchParams()
  if (category && category !== 'all') params.set('category', category)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

function RatingRow({ post }: { post: SitePost }) {
  const rating = ratingOf(post)
  const rounded = Math.round(rating)
  return (
    <div className="mt-2 flex items-center gap-2">
      {[0, 1, 2, 3, 4].map((item) => (
        <Star key={item} className={`h-4 w-4 ${item < rounded ? 'fill-[var(--tk-accent)] text-[var(--tk-accent)]' : 'fill-[var(--tk-line)] text-[var(--tk-line)]'}`} />
      ))}
      <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
    </div>
  )
}

export async function DirectoryArchiveRoute({
  searchParams,
  basePath = '/listing',
}: {
  searchParams?: Promise<{ category?: string; page?: string }>
  basePath?: string
}) {
  const resolved = (await searchParams) || {}
  const page = Math.max(1, Math.floor(Number(resolved.page) || 1))
  const category = resolved.category ? normalizeCategory(resolved.category) : 'all'
  const { posts, pagination } = await fetchPaginatedTaskPosts('listing', { page, limit: 18, category })
  return <DirectoryArchiveView posts={posts} pagination={pagination} category={category} basePath={basePath} />
}

function DirectoryArchiveView({
  posts,
  pagination,
  category,
  basePath,
}: {
  posts: SitePost[]
  pagination: SiteFeedPagination
  category: string
  basePath: string
}) {
  const page = pagination.page || 1
  const categoryLabel = category === 'all' ? 'All categories' : CATEGORY_OPTIONS.find((item) => item.slug === category)?.name || category
  return (
    <EditableSiteShell>
      <main style={taskThemeStyle('listing')} className="min-h-screen bg-[var(--tk-bg)] text-[var(--tk-text)]">
        <section className="border-b border-[var(--tk-line)]">
          <div className="mx-auto max-w-[var(--editable-container)] px-6 py-16 lg:px-8">
            <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
              <div>
                <p className="editable-tech text-xs font-bold uppercase tracking-[0.26em] text-[var(--tk-accent)]">Business Directory</p>
                <h1 className="editable-display mt-5 text-[3.2rem] font-semibold uppercase leading-[0.9] tracking-[-0.06em] sm:text-[4.6rem]">
                  Discover businesses with a cleaner market view.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--tk-muted)]">
                  Compare local businesses, service providers, and company profiles through the same strong visual system as the home page.
                </p>
                <form action={basePath} className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <select name="category" defaultValue={category} className="h-14 w-full appearance-none border border-[var(--tk-line)] bg-[var(--tk-surface)] pl-5 pr-12 text-sm outline-none">
                      <option value="all">All categories</option>
                      {CATEGORY_OPTIONS.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tk-muted)]" />
                  </div>
                  <button className="h-14 bg-[var(--tk-accent)] px-8 text-sm font-bold uppercase tracking-[0.16em] text-[var(--tk-on-accent)]">Apply</button>
                </form>
              </div>
              <div className="grid gap-4 self-end">
                <div className="border border-[var(--tk-line)] bg-[rgba(255,255,255,0.68)] p-5">
                  <div className="flex items-center gap-3 text-[var(--tk-accent)]">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-[0.14em]">Directory count</span>
                  </div>
                  <p className="mt-5 text-5xl font-semibold tracking-[-0.05em]">{posts.length}</p>
                  <p className="mt-2 text-sm text-[var(--tk-muted)]">Businesses in view</p>
                </div>
                <div className="border border-[var(--tk-line)] bg-[rgba(255,255,255,0.68)] p-5">
                  <div className="flex items-center gap-3 text-[var(--tk-accent)]">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-[0.14em]">Current focus</span>
                  </div>
                  <p className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{categoryLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[var(--editable-container)] px-6 py-14 lg:px-8">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <Ads slot="header" showLabel eager className="mx-auto w-full" />
          </div>

          {posts.length ? (
            <div className="mt-4 grid gap-5 xl:grid-cols-2">
              {posts.map((post, index) => (
                <Link key={post.id || post.slug || post.title} href={`${basePath}/${post.slug}`} className={`group overflow-hidden border border-[var(--tk-line)] bg-[var(--tk-surface)] transition duration-300 hover:-translate-y-1 ${index % 3 === 0 ? 'xl:grid xl:grid-cols-[220px_minmax(0,1fr)]' : ''}`}>
                  <img src={imageOf(post)} alt={post.title} className={`w-full object-cover ${index % 3 === 0 ? 'h-full min-h-[220px]' : 'aspect-[16/10]'}`} />
                  <div className="p-5">
                    <p className="editable-tech text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--tk-accent)]">{categoryOf(post)}</p>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight">{post.title}</h2>
                    <RatingRow post={post} />
                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-[var(--tk-muted)]">{summaryOf(post)}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-[var(--tk-muted)]">
                      {fieldOf(post, ['location', 'address', 'city']) ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[var(--tk-accent)]" /> {fieldOf(post, ['location', 'address', 'city'])}</span> : null}
                      {fieldOf(post, ['phone', 'telephone', 'mobile']) ? <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[var(--tk-accent)]" /> {fieldOf(post, ['phone', 'telephone', 'mobile'])}</span> : null}
                    </div>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[var(--tk-accent)]">Open listing <ArrowUpRight className="h-4 w-4" /></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}

          {posts.length ? (
            <nav className="mt-12 flex items-center justify-center gap-3">
              {pagination.hasPrevPage ? <Link href={pageHref(basePath, category, page - 1)} className="border border-[var(--tk-line)] bg-[var(--tk-surface)] px-5 py-3 text-sm font-medium">Previous</Link> : null}
              <span className="border border-[var(--tk-line)] bg-[var(--tk-surface)] px-5 py-3 text-sm font-medium text-[var(--tk-muted)]">Page {page} of {pagination.totalPages || 1}</span>
              {pagination.hasNextPage ? <Link href={pageHref(basePath, category, page + 1)} className="border border-[var(--tk-line)] bg-[var(--tk-surface)] px-5 py-3 text-sm font-medium">Next</Link> : null}
            </nav>
          ) : null}
        </section>
      </main>
    </EditableSiteShell>
  )
}

export async function generateDirectoryDetailMetadata(params: Promise<{ slug?: string }>) {
  const resolved = await params
  const post = await fetchTaskPostBySlug('listing', resolved.slug || '')
  return post ? buildPostMetadata('listing', post) : buildTaskMetadata('listing')
}

export async function DirectoryDetailRoute({ params }: { params: Promise<{ slug?: string }> }) {
  const resolved = await params
  const post = await fetchTaskPostBySlug('listing', resolved.slug || '')
  if (!post) notFound()
  const related = (await fetchTaskPosts('listing', 6)).filter((item) => item.slug !== post.slug).slice(0, 3)
  return <DirectoryDetailView post={post} related={related} />
}

function DirectoryDetailView({ post, related }: { post: SitePost; related: SitePost[] }) {
  const address = fieldOf(post, ['address', 'location', 'city'])
  const phone = fieldOf(post, ['phone', 'telephone', 'mobile'])
  const email = fieldOf(post, ['email'])
  const website = fieldOf(post, ['website', 'url'])
  return (
    <EditableSiteShell>
      <main style={taskThemeStyle('listing')} className="min-h-screen bg-[var(--tk-bg)] text-[var(--tk-text)]">
        <section className="mx-auto max-w-[var(--editable-container)] px-6 py-14 lg:px-8">
          <Link href={getTaskConfig('listing')?.route || '/listing'} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--tk-muted)]">
            <ArrowLeft className="h-4 w-4" /> Back to Listings
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="min-w-0">
              <div className="grid gap-6 border border-[var(--tk-line)] bg-[var(--tk-surface)] p-6 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden border border-[var(--tk-line)] bg-[var(--tk-raised)]">
                  <img src={imageOf(post)} alt={post.title} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="editable-tech text-xs font-bold uppercase tracking-[0.18em] text-[var(--tk-accent)]">{categoryOf(post)}</p>
                  <h1 className="editable-display mt-3 text-[3rem] font-semibold uppercase leading-[0.9] tracking-[-0.05em]">{post.title}</h1>
                  <RatingRow post={post} />
                  <div className="article-content mt-4 max-w-2xl text-base leading-8 text-[var(--tk-muted)]" dangerouslySetInnerHTML={{ __html: formatPlainText(post.summary || asText(getContent(post).description) || asText(getContent(post).excerpt) || '') }} />
                </div>
              </div>

              <div className="mt-8 border border-[var(--tk-line)] bg-[var(--tk-surface)] p-6">
                <h2 className="editable-display text-3xl font-semibold uppercase tracking-[-0.05em]">Overview</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {address ? <div className="border border-[var(--tk-line)] bg-[rgba(255,255,255,0.65)] p-4 text-sm"><span className="inline-flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-[var(--tk-accent)]" /> Location</span><p className="mt-2 leading-7">{address}</p></div> : null}
                  {phone ? <div className="border border-[var(--tk-line)] bg-[rgba(255,255,255,0.65)] p-4 text-sm"><span className="inline-flex items-center gap-2 font-semibold"><Phone className="h-4 w-4 text-[var(--tk-accent)]" /> Phone</span><p className="mt-2 leading-7">{phone}</p></div> : null}
                  {email ? <div className="border border-[var(--tk-line)] bg-[rgba(255,255,255,0.65)] p-4 text-sm"><span className="inline-flex items-center gap-2 font-semibold"><Mail className="h-4 w-4 text-[var(--tk-accent)]" /> Email</span><p className="mt-2 leading-7">{email}</p></div> : null}
                  {website ? <div className="border border-[var(--tk-line)] bg-[rgba(255,255,255,0.65)] p-4 text-sm"><span className="inline-flex items-center gap-2 font-semibold"><Globe2 className="h-4 w-4 text-[var(--tk-accent)]" /> Website</span><p className="mt-2 break-words leading-7">{website}</p></div> : null}
                </div>
                <div className="article-content mt-8 whitespace-pre-line text-[1rem] leading-8">{bodyOf(post)}</div>
              </div>
            </article>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="mx-auto max-w-6xl px-4 py-6">
                <Ads slot="sidebar" showLabel eager className="mx-auto w-full" />
              </div>
              <div className="border border-[var(--tk-line)] bg-[var(--tk-surface)] p-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--tk-accent)]">Contact</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {website ? <Link href={website} target="_blank" rel="noreferrer" className="bg-[var(--tk-accent)] px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--tk-on-accent)]">Website</Link> : null}
                  {phone ? <a href={`tel:${phone}`} className="border border-[var(--tk-line)] px-5 py-3 text-sm font-bold uppercase tracking-[0.14em]">Call</a> : null}
                  {email ? <a href={`mailto:${email}`} className="border border-[var(--tk-line)] px-5 py-3 text-sm font-bold uppercase tracking-[0.14em]">Email</a> : null}
                </div>
              </div>
            </aside>
          </div>

          {related.length ? (
            <section className="mt-14 border-t border-[var(--tk-line)] pt-10">
              <div className="flex items-center justify-between gap-4">
                <h2 className="editable-display text-3xl font-semibold uppercase tracking-[-0.05em]">More Listings</h2>
                <Link href="/listing" className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--tk-accent)]">View all</Link>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {related.map((item) => (
                  <Link key={item.id || item.slug || item.title} href={`/listing/${item.slug}`} className="overflow-hidden border border-[var(--tk-line)] bg-[var(--tk-surface)] transition duration-300 hover:-translate-y-1">
                    <img src={imageOf(item)} alt={item.title} className="aspect-[16/11] w-full object-cover" />
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-lg font-semibold leading-snug">{item.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--tk-muted)]">{summaryOf(item)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </main>
    </EditableSiteShell>
  )
}
