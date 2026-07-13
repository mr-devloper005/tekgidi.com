import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, ChevronDown, Clock3, Shield, Star } from 'lucide-react'
import { buildPostMetadata, buildTaskMetadata } from '@/lib/seo'
import { CATEGORY_OPTIONS, normalizeCategory } from '@/lib/categories'
import { fetchArticleComments, fetchPaginatedTaskPosts, fetchTaskPostBySlug, fetchTaskPosts } from '@/lib/task-data'
import { SITE_CONFIG } from '@/lib/site-config'
import type { SiteFeedPagination, SitePost } from '@/lib/site-connector'
import { taskPageMetadata } from '@/config/site.content'
import { EditableArticleComments } from '@/editable/components/EditableArticleComments'
import { EditableSiteShell } from '@/editable/shell/EditableSiteShell'
import { taskThemeStyle } from '@/editable/theme/task-themes'
import { Ads } from '@/lib/ads'

export const editorialTaskMetadata = () =>
  buildTaskMetadata('article', {
    path: '/article',
    title: taskPageMetadata.article?.title,
    description: taskPageMetadata.article?.description,
  })

const getContent = (post: SitePost) => (post.content && typeof post.content === 'object' ? (post.content as Record<string, unknown>) : {})
const asText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const summaryOf = (post: SitePost) => stripHtml(post.summary || asText(getContent(post).description) || asText(getContent(post).excerpt) || asText(getContent(post).body) || '')
const categoryOf = (post: SitePost) => asText(getContent(post).category) || post.tags?.[0] || 'Article'
const imageOf = (post: SitePost) => {
  const content = getContent(post)
  const media = Array.isArray(post.media) ? post.media.find((item) => typeof item?.url === 'string' && item.url)?.url : ''
  const images = Array.isArray(content.images) ? content.images.find((item) => typeof item === 'string' && item) : ''
  return media || asText(content.featuredImage) || asText(content.image) || (typeof images === 'string' ? images : '') || '/placeholder.svg?height=900&width=1400'
}
const bodyOf = (post: SitePost) => asText(getContent(post).body) || asText(getContent(post).description) || post.summary || 'Details will appear here once available.'
const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const safeUrl = (value: string) => (/^https?:\/\//i.test(value) ? value : '#')
const linkifyText = (value: string) =>
  value.replace(/(^|[\s(>])((https?:\/\/)[^\s<)]+)/gi, (_match, prefix, url) => `${prefix}<a href="${safeUrl(url)}" target="_blank" rel="nofollow noopener noreferrer">${url}</a>`)
const formatPlainText = (raw: string) =>
  raw
    .trim()
    .split(/\n{2,}/)
    .map((part) => `<p>${linkifyText(escapeHtml(part).replace(/\n/g, '<br />'))}</p>`)
    .join('')

const hashStr = (value: string) => {
  let h = 0
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}
const ratingOf = (post: SitePost) => {
  const real = Number(getContent(post).rating)
  if (real >= 1 && real <= 5) return Math.round(real * 10) / 10
  return Math.round((3.9 + (hashStr(post.slug || post.title || 'x') % 10) / 10) * 10) / 10
}

function RatingRow({ post }: { post: SitePost }) {
  const rating = ratingOf(post)
  const rounded = Math.round(rating)
  return (
    <div className="mt-3 flex items-center gap-2">
      {[0, 1, 2, 3, 4].map((item) => (
        <Star key={item} className={`h-4 w-4 ${item < rounded ? 'fill-[var(--tk-accent)] text-[var(--tk-accent)]' : 'fill-[var(--tk-line)] text-[var(--tk-line)]'}`} />
      ))}
      <span className="text-sm font-semibold text-[var(--tk-text)]">{rating.toFixed(1)}</span>
    </div>
  )
}

function pageHref(basePath: string, category: string, page: number) {
  const params = new URLSearchParams()
  if (category && category !== 'all') params.set('category', category)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

function detailHref(basePath: string, slug?: string) {
  return slug ? `${basePath}/${slug}` : basePath
}

export async function EditorialArchiveRoute({
  searchParams,
  basePath = '/article',
}: {
  searchParams?: Promise<{ category?: string; page?: string }>
  basePath?: string
}) {
  const resolved = (await searchParams) || {}
  const page = Math.max(1, Math.floor(Number(resolved.page) || 1))
  const category = resolved.category ? normalizeCategory(resolved.category) : 'all'
  const { posts, pagination } = await fetchPaginatedTaskPosts('article', { page, limit: 18, category })
  return <EditorialArchiveView posts={posts} pagination={pagination} category={category} basePath={basePath} />
}

function EditorialArchiveView({
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
  const lead = posts[0]
  const side = posts.slice(1, 4)
  const rest = posts.slice(4)

  return (
    <EditableSiteShell>
      <main style={taskThemeStyle('article')} className="min-h-screen bg-[var(--tk-bg)] text-[var(--tk-text)]">
        <section className="border-b border-[var(--tk-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.5),transparent)]">
          <div className="mx-auto max-w-[var(--editable-container)] px-6 py-16 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
              <div>
                <p className="editable-tech text-xs font-bold uppercase tracking-[0.26em] text-[var(--tk-accent)]">Editorial Desk</p>
                <h1 className="editable-display mt-5 max-w-3xl text-[3.4rem] font-semibold uppercase leading-[0.9] tracking-[-0.06em] sm:text-[4.8rem]">
                  Read the stories shaping the market.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--tk-muted)]">
                  Explore long-form articles, local insights, and useful reads presented in the same bold marketplace language as the home page.
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

              {lead ? (
                <Link href={detailHref(basePath, lead.slug)} className="group overflow-hidden rounded-[1.1rem] border border-[var(--tk-line)] bg-[var(--tk-surface)] shadow-[0_24px_60px_rgba(16,16,12,0.12)]">
                  <img src={imageOf(lead)} alt={lead.title} className="aspect-[16/11] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  <div className="bg-white px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="editable-tech bg-black px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">{categoryOf(lead)}</span>
                      <span className="text-sm text-[var(--tk-muted)]">{SITE_CONFIG.name}</span>
                    </div>
                    <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em]">{lead.title}</h2>
                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-[var(--tk-muted)]">{summaryOf(lead)}</p>
                  </div>
                </Link>
              ) : null}
            </div>

            <div className="mt-8">
              <div className="mx-auto max-w-6xl px-4 py-6">
                <Ads slot="in-feed" showLabel eager className="mx-auto w-full" />
              </div>
            </div>

            {side.length ? (
              <div className="mt-2 grid gap-5 md:grid-cols-3">
                {side.map((post) => (
                  <Link key={post.id || post.slug || post.title} href={detailHref(basePath, post.slug)} className="border border-[var(--tk-line)] bg-[var(--tk-surface)] p-4 transition duration-300 hover:-translate-y-1">
                    <p className="editable-tech text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--tk-accent)]">{categoryOf(post)}</p>
                    <h3 className="mt-2 text-xl font-semibold leading-snug">{post.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--tk-muted)]">{summaryOf(post)}</p>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-[var(--editable-container)] px-6 py-14 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="editable-tech text-xs font-bold uppercase tracking-[0.18em] text-[var(--tk-muted)]">{posts.length} stories</p>
              <h2 className="editable-display mt-2 text-[3rem] font-semibold uppercase leading-none tracking-[-0.05em]">Latest Reads</h2>
            </div>
            <div className="border border-[var(--tk-line)] bg-[rgba(255,255,255,0.68)] px-5 py-3 text-sm text-[var(--tk-muted)]">
              Current focus: <span className="font-semibold text-[var(--tk-text)]">{categoryLabel}</span>
            </div>
          </div>

          {rest.length ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {rest.map((post, index) => (
                <Link
                  key={post.id || post.slug || post.title}
                  href={detailHref(basePath, post.slug)}
                  className={`group overflow-hidden border border-[var(--tk-line)] bg-[var(--tk-surface)] transition duration-300 hover:-translate-y-1 ${index % 4 === 0 ? 'xl:col-span-2 xl:grid xl:grid-cols-[280px_minmax(0,1fr)]' : ''}`}
                >
                  <img src={imageOf(post)} alt={post.title} className={`w-full object-cover ${index % 4 === 0 ? 'h-full min-h-[260px]' : 'aspect-[16/11]'}`} />
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--tk-accent)]">
                      <span>{categoryOf(post)}</span>
                      <Clock3 className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.04em]">{post.title}</h3>
                    <RatingRow post={post} />
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--tk-muted)]">{summaryOf(post)}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[var(--tk-accent)]">
                      Read article <ArrowRight className="h-4 w-4" />
                    </span>
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

export async function generateEditorialDetailMetadata(params: Promise<{ slug?: string }>) {
  const resolved = await params
  const post = await fetchTaskPostBySlug('article', resolved.slug || '')
  return post ? buildPostMetadata('article', post) : buildTaskMetadata('article')
}

export async function EditorialDetailRoute({ params }: { params: Promise<{ slug?: string }> }) {
  const resolved = await params
  const post = await fetchTaskPostBySlug('article', resolved.slug || '')
  if (!post) notFound()
  const related = (await fetchTaskPosts('article', 6)).filter((item) => item.slug !== post.slug).slice(0, 3)
  const comments = await fetchArticleComments(post.slug, 50)
  return <EditorialDetailView post={post} related={related} comments={comments} />
}

function EditorialDetailView({
  post,
  related,
  comments,
}: {
  post: SitePost
  related: SitePost[]
  comments: Array<{ id: string; name: string; comment: string; createdAt: string }>
}) {
  return (
    <EditableSiteShell>
      <main style={taskThemeStyle('article')} className="min-h-screen bg-[var(--tk-bg)] text-[var(--tk-text)]">
        <section className="mx-auto max-w-[var(--editable-container)] px-6 py-14 lg:px-8">
          <Link href="/article" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--tk-muted)]">
            <ArrowLeft className="h-4 w-4" /> Back to Articles
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[0.86fr_1.14fr]">
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden border border-[var(--tk-line)] bg-[var(--tk-surface)]">
                <img src={imageOf(post)} alt={post.title} className="aspect-[4/5] w-full object-cover" />
                <div className="p-5">
                  <p className="editable-tech text-xs font-bold uppercase tracking-[0.18em] text-[var(--tk-accent)]">{categoryOf(post)}</p>
                  <RatingRow post={post} />
                  <p className="mt-4 text-sm leading-7 text-[var(--tk-muted)]">{summaryOf(post)}</p>
                </div>
              </div>
              <div className="border border-[var(--tk-line)] bg-[rgba(255,255,255,0.68)] p-5">
                <div className="flex items-center gap-3 text-[var(--tk-accent)]">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-[0.14em]">Reading lane</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--tk-muted)]">Long-form copy, calm spacing, and supporting cards now follow the same editorial-marketplace system as the home page.</p>
              </div>
            </aside>

            <article className="min-w-0">
              <p className="editable-tech text-xs font-bold uppercase tracking-[0.18em] text-[var(--tk-accent)]">{categoryOf(post)}</p>
              <h1 className="editable-display mt-4 text-[3.4rem] font-semibold uppercase leading-[0.9] tracking-[-0.06em] sm:text-[4.6rem]">{post.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--tk-muted)]">{summaryOf(post)}</p>

              <div className="article-content mt-10 border-t border-[var(--tk-line)] pt-8 text-[1.04rem] leading-8" dangerouslySetInnerHTML={{ __html: formatPlainText(bodyOf(post)) }} />

              <div className="mx-auto mt-10 max-w-6xl px-4 py-6">
                <Ads slot="article-bottom" showLabel eager className="mx-auto w-full" />
              </div>

              <EditableArticleComments slug={post.slug} comments={comments} />
            </article>
          </div>

          {related.length ? (
            <section className="mt-14 border-t border-[var(--tk-line)] pt-10">
              <div className="flex items-center justify-between gap-4">
                <h2 className="editable-display text-3xl font-semibold uppercase tracking-[-0.05em]">More Reads</h2>
                <Link href="/article" className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--tk-accent)]">View all</Link>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {related.map((item) => (
                  <Link key={item.id || item.slug || item.title} href={`/article/${item.slug}`} className="overflow-hidden border border-[var(--tk-line)] bg-[var(--tk-surface)] transition duration-300 hover:-translate-y-1">
                    <img src={imageOf(item)} alt={item.title} className="aspect-[16/11] w-full object-cover" />
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-xl font-semibold leading-snug">{item.title}</h3>
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
