import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, ChevronDown, Mail, MapPin, Phone, Shield, Sparkles, Star, UserRound } from 'lucide-react'
import { buildPostMetadata, buildTaskMetadata } from '@/lib/seo'
import { CATEGORY_OPTIONS, normalizeCategory } from '@/lib/categories'
import { fetchPaginatedTaskPosts, fetchTaskPostBySlug, fetchTaskPosts } from '@/lib/task-data'
import { getTaskConfig, type TaskKey } from '@/lib/site-config'
import type { SiteFeedPagination, SitePost } from '@/lib/site-connector'
import { taskPageMetadata } from '@/config/site.content'
import { EditableSiteShell } from '@/editable/shell/EditableSiteShell'
import { taskThemeStyle } from '@/editable/theme/task-themes'
import { Ads } from '@/lib/ads'

export const revalidate = 3

const getContent = (post: SitePost) => post.content && typeof post.content === 'object' ? post.content as Record<string, unknown> : {}
const asText = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const safeSummary = (post: SitePost) => stripHtml(post.summary || asText(getContent(post).description) || asText(getContent(post).body) || 'Details will appear soon.')
const safeCategory = (post: SitePost, fallback: string) => asText(getContent(post).category) || post.tags?.[0] || fallback
const safeImage = (post: SitePost) => {
  const content = getContent(post)
  const media = Array.isArray(post.media) ? post.media : []
  const mediaImage = media.find((item) => typeof item?.url === 'string' && item.url)?.url
  const gallery = Array.isArray(content.images) ? content.images.find((item) => typeof item === 'string' && item) : ''
  return mediaImage || gallery || asText(content.image) || asText(content.logo) || '/placeholder.svg?height=900&width=1200'
}
const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
const safeUrl = (value: string) => /^https?:\/\//i.test(value) ? value : '#'
const linkifyMarkdown = (value: string) => value
  .replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/gi, (_match, label, url) => `<a href="${safeUrl(url)}" target="_blank" rel="nofollow noopener noreferrer">${label}</a>`)
const linkifyText = (value: string) => linkifyMarkdown(value)
  .replace(/(^|[\s(>])((https?:\/\/)[^\s<)]+)/gi, (_match, prefix, url) => `${prefix}<a href="${safeUrl(url)}" target="_blank" rel="nofollow noopener noreferrer">${url}</a>`)
const hardenLinks = (html: string) => html.replace(/<a\s+([^>]*href=["'][^"']+["'][^>]*)>/gi, (_match, attrs) => {
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
const formatBodyHtml = (raw: string) => {
  const value = raw.trim()
  if (!value) return ''
  if (/<[a-z][\s\S]*>/i.test(value)) return sanitizeHtml(linkifyMarkdown(value))
  return value
    .split(/\n{2,}/)
    .map((part) => `<p>${linkifyText(escapeHtml(part).replace(/\n/g, '<br />'))}</p>`)
    .join('')
}
const safeField = (post: SitePost, keys: string[]) => {
  const content = getContent(post)
  for (const key of keys) {
    const value = asText(content[key])
    if (value) return value
  }
  return ''
}
const ratingOf = (post: SitePost) => {
  const real = Number(getContent(post).rating)
  if (real >= 1 && real <= 5) return Math.round(real * 10) / 10
  const basis = (post.slug || post.id || post.title || '').length
  return Math.round((4 + (basis % 8) / 10) * 10) / 10
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

export const marketplaceTaskMetadata = (task: TaskKey, path: string) =>
  buildTaskMetadata(task, {
    path,
    title: taskPageMetadata[task]?.title,
    description: taskPageMetadata[task]?.description,
  })

export async function MarketplaceArchiveRoute({
  task,
  searchParams,
  basePath,
}: {
  task: TaskKey
  searchParams?: Promise<{ category?: string; page?: string }>
  basePath: string
}) {
  const resolved = (await searchParams) || {}
  const page = Math.max(1, Math.floor(Number(resolved.page) || 1))
  const category = resolved.category ? normalizeCategory(resolved.category) : 'all'
  const { posts, pagination } = await fetchPaginatedTaskPosts(task, { page, limit: 18, category })
  return <MarketplaceArchiveView task={task} posts={posts} pagination={pagination} category={category} basePath={basePath} />
}

function MarketplaceArchiveView({ task, posts, pagination, category, basePath }: { task: TaskKey; posts: SitePost[]; pagination: SiteFeedPagination; category: string; basePath: string }) {
  const label = getTaskConfig(task)?.label || task
  const categoryLabel = category === 'all' ? 'All categories' : CATEGORY_OPTIONS.find((item) => item.slug === category)?.name || category
  const page = pagination.page || 1
  const isProfile = task === 'profile'

  return (
    <EditableSiteShell>
      <main style={taskThemeStyle(task)} className="min-h-screen bg-[var(--tk-bg)] text-[var(--tk-text)]">
        <section className="border-b border-[var(--tk-line)]">
          <div className="mx-auto max-w-[var(--editable-container)] px-6 py-16 lg:px-8">
            <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
              <div>
                <p className="editable-tech text-xs font-bold uppercase tracking-[0.26em] text-[var(--tk-accent)]">
                  {isProfile ? 'People and Profiles' : 'Active marketplace'}
                </p>
                <h1 className="editable-display mt-5 max-w-4xl text-[3.2rem] font-semibold leading-[0.95] tracking-[-0.05em] sm:text-[4.4rem]">
                  {isProfile ? 'Profiles with stronger identity and trust cues.' : 'Classified opportunities built for faster scanning.'}
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--tk-muted)]">
                  {isProfile
                    ? 'Discover people, companies, and local operators through cleaner profile cards with safer fallbacks.'
                    : 'Compare urgent offers, featured deals, and local opportunities through a clearer, price-forward layout.'}
                </p>
                <form action={basePath} className="mt-10 flex flex-col gap-3 md:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <select name="category" defaultValue={category} className="h-14 w-full appearance-none border border-[var(--tk-line)] bg-[var(--tk-surface)] pl-5 pr-12 text-sm outline-none">
                      <option value="all">All categories</option>
                      {CATEGORY_OPTIONS.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tk-muted)]" />
                  </div>
                  <button className="h-14 bg-[var(--tk-accent)] px-8 text-sm font-bold uppercase tracking-[0.16em] text-[var(--tk-on-accent)]">
                    Apply
                  </button>
                </form>
              </div>

              <div className="grid gap-4 self-end">
                <div className="border border-[var(--tk-line)] bg-[rgba(255,255,255,0.68)] p-5">
                  <div className="flex items-center gap-3 text-[var(--tk-accent)]">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-[0.14em]">In view</span>
                  </div>
                  <p className="mt-5 text-5xl font-semibold tracking-[-0.05em]">{posts.length}</p>
                  <p className="mt-2 text-sm text-[var(--tk-muted)]">{label} ready to browse</p>
                </div>
                <div className="border border-[var(--tk-line)] bg-[rgba(255,255,255,0.68)] p-5">
                  <div className="flex items-center gap-3 text-[var(--tk-accent)]">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-sm font-semibold uppercase tracking-[0.14em]">Filter</span>
                  </div>
                  <p className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{categoryLabel}</p>
                  <p className="mt-2 text-sm text-[var(--tk-muted)]">Every card safely renders even when category, summary, or image data is missing.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[var(--editable-container)] px-6 py-14 lg:px-8">
          {isProfile ? (
            <div className="mx-auto max-w-6xl px-4 py-6">
              <Ads slot="sidebar" showLabel eager className="mx-auto w-full" />
            </div>
          ) : null}

          {posts.length ? (
            <div className={isProfile ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3'}>
              {posts.map((post) => (
                isProfile ? <ProfileCard key={post.id || post.slug || post.title} post={post} href={`${basePath}/${post.slug}`} /> : <ClassifiedCard key={post.id || post.slug || post.title} post={post} href={`${basePath}/${post.slug}`} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[var(--tk-line)] bg-[rgba(255,255,255,0.6)] px-8 py-16 text-center">
              <h2 className="editable-display text-3xl font-semibold tracking-[-0.04em]">Nothing is showing here yet</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--tk-muted)]">Try another category or check back after more {label.toLowerCase()} are published.</p>
            </div>
          )}

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

function ClassifiedCard({ post, href }: { post: SitePost; href: string }) {
  const price = safeField(post, ['price', 'amount', 'budget']) || 'Open offer'
  const location = safeField(post, ['location', 'address', 'city']) || 'Regional listing'
  const condition = safeField(post, ['condition', 'availability', 'type']) || safeCategory(post, 'Classified')
  return (
    <Link href={href} className="group overflow-hidden border border-[var(--tk-line)] bg-[var(--tk-surface)] transition duration-300 hover:-translate-y-1">
      <div className="aspect-[16/11] overflow-hidden bg-[var(--tk-raised)]">
        <img src={safeImage(post)} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--tk-line)] pb-4">
          <span className="editable-display text-4xl font-semibold tracking-[-0.05em] text-[var(--tk-accent)]">{price}</span>
          <span className="bg-[var(--tk-accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tk-accent)]">{condition}</span>
        </div>
        <h2 className="mt-4 text-2xl font-semibold leading-tight text-[var(--tk-text)]">{post.title}</h2>
        <RatingRow post={post} />
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--tk-muted)]">{safeSummary(post)}</p>
        <div className="mt-5 flex items-center justify-between text-xs font-medium uppercase tracking-[0.12em] text-[var(--tk-muted)]">
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {location}</span>
          <ArrowUpRight className="h-4 w-4 text-[var(--tk-accent)]" />
        </div>
      </div>
    </Link>
  )
}

function ProfileCard({ post, href }: { post: SitePost; href: string }) {
  const role = safeField(post, ['role', 'designation', 'company', 'location']) || safeCategory(post, 'Profile')
  return (
    <Link href={href} className="group border border-[var(--tk-line)] bg-[var(--tk-surface)] p-6 text-center transition duration-300 hover:-translate-y-1">
      <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[var(--tk-line)] bg-[var(--tk-raised)]">
        {safeImage(post) ? <img src={safeImage(post)} alt={post.title} className="h-full w-full object-cover" /> : <UserRound className="h-10 w-10 text-[var(--tk-muted)]" />}
      </div>
      <h2 className="mt-5 text-2xl font-semibold leading-tight text-[var(--tk-text)]">{post.title}</h2>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tk-accent)]">{role}</p>
      <RatingRow post={post} />
      <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--tk-muted)]">{safeSummary(post)}</p>
      <span className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.16em] text-[var(--tk-accent)]">Open profile</span>
    </Link>
  )
}

export async function generateMarketplaceDetailMetadata(task: TaskKey, params: Promise<{ slug?: string; username?: string }>) {
  const resolved = await params
  const slug = resolved.slug || resolved.username || ''
  const post = await fetchTaskPostBySlug(task, slug)
  return post ? buildPostMetadata(task, post) : buildTaskMetadata(task)
}

export async function MarketplaceDetailRoute({ task, params }: { task: TaskKey; params: Promise<{ slug?: string; username?: string }> }) {
  const resolved = await params
  const slug = resolved.slug || resolved.username || ''
  const post = await fetchTaskPostBySlug(task, slug)
  if (!post) notFound()
  const related = (await fetchTaskPosts(task, 6)).filter((item) => item.slug !== post.slug).slice(0, 3)
  return <MarketplaceDetailView task={task} post={post} related={related} />
}

function MarketplaceDetailView({ task, post, related }: { task: TaskKey; post: SitePost; related: SitePost[] }) {
  const isProfile = task === 'profile'
  const backHref = getTaskConfig(task)?.route || `/${task}`
  const price = safeField(post, ['price', 'amount', 'budget'])
  const role = safeField(post, ['role', 'designation', 'company', 'location'])
  const location = safeField(post, ['location', 'address', 'city'])
  const phone = safeField(post, ['phone', 'telephone', 'mobile'])
  const email = safeField(post, ['email'])
  const website = safeField(post, ['website', 'url'])
  const summary = safeSummary(post)
  const rawSummary = post.summary || asText(getContent(post).description) || asText(getContent(post).body) || ''
  const rawBody = asText(getContent(post).body) || asText(getContent(post).description) || post.summary || ''
  const bodyIsDuplicate = rawBody && stripHtml(rawBody) === summary
  const body = !rawBody || bodyIsDuplicate ? '' : rawBody

  return (
    <EditableSiteShell>
      <main style={taskThemeStyle(task)} className="min-h-screen bg-[var(--tk-bg)] text-[var(--tk-text)]">
        <section className="mx-auto max-w-[var(--editable-container)] px-6 py-14 lg:px-8">
          <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--tk-muted)]">
            <ArrowLeft className="h-4 w-4" /> Back to {getTaskConfig(task)?.label || task}
          </Link>

          <div className={`mt-8 grid gap-10 ${isProfile ? 'lg:grid-cols-[360px_minmax(0,1fr)]' : 'lg:grid-cols-[380px_minmax(0,1fr)]'}`}>
            <aside className="space-y-6">
              <div className="border border-[var(--tk-line)] bg-[var(--tk-surface)] p-7 text-center">
                <div className={`mx-auto flex ${isProfile ? 'h-32 w-32 rounded-full' : 'h-64 w-full rounded-[1rem]'} items-center justify-center overflow-hidden border border-[var(--tk-line)] bg-[var(--tk-raised)]`}>
                  <img src={safeImage(post)} alt={post.title} className="h-full w-full object-cover" />
                </div>
                <p className="editable-tech mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--tk-accent)]">{isProfile ? 'Profile' : 'Classified'}</p>
                <h1 className="editable-display mt-3 text-[2.4rem] font-semibold leading-[0.95] tracking-[-0.05em]">{post.title}</h1>
                {isProfile ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tk-accent)]">{role || safeCategory(post, 'Profile')}</p> : null}
                {!isProfile ? <p className="editable-display mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--tk-accent)]">{price || 'Open offer'}</p> : null}
                <RatingRow post={post} />
              </div>

              <div className="border border-[var(--tk-line)] bg-[var(--tk-surface)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tk-muted)]">Quick facts</p>
                <div className="mt-4 grid gap-3 text-sm">
                  {location ? <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--tk-accent)]" /> {location}</div> : null}
                  {phone ? <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-[var(--tk-accent)]" /> {phone}</div> : null}
                  {email ? <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[var(--tk-accent)]" /> {email}</div> : null}
                  {website ? <div className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-[var(--tk-accent)]" /> {website}</div> : null}
                </div>
              </div>
            </aside>

            <article className="min-w-0">
              <div className="border border-[var(--tk-line)] bg-[var(--tk-surface)] p-7">
                <p className="editable-tech text-xs font-bold uppercase tracking-[0.18em] text-[var(--tk-accent)]">{safeCategory(post, isProfile ? 'Profile' : 'Classified')}</p>
                <div className="article-content mt-5 text-lg leading-8 text-[var(--tk-muted)]" dangerouslySetInnerHTML={{ __html: formatBodyHtml(rawSummary || summary) }} />
                {body ? <div className="article-content mt-8 text-[1.02rem] leading-8 text-[var(--tk-text)]" dangerouslySetInnerHTML={{ __html: formatBodyHtml(body) }} /> : null}
              </div>

              {isProfile ? (
                <div className="mx-auto mt-8 max-w-6xl px-4 py-6">
                  <Ads slot="footer" showLabel eager className="mx-auto w-full" />
                </div>
              ) : null}

              {related.length ? (
                <div className="mt-8">
                  <h2 className="editable-display text-3xl font-semibold tracking-[-0.04em]">More to explore</h2>
                  <div className="mt-5 grid gap-5 md:grid-cols-3">
                    {related.map((item) => (
                      <Link key={item.id || item.slug || item.title} href={`${backHref}/${item.slug}`} className="overflow-hidden border border-[var(--tk-line)] bg-[var(--tk-surface)] transition duration-300 hover:-translate-y-1">
                        <img src={safeImage(item)} alt={item.title} className="aspect-[16/11] w-full object-cover" />
                        <div className="p-4">
                          <h3 className="line-clamp-2 text-lg font-semibold leading-snug">{item.title}</h3>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--tk-muted)]">{safeSummary(item)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          </div>
        </section>
      </main>
    </EditableSiteShell>
  )
}
