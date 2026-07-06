import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Filter, Search } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'
import { fetchSiteFeed } from '@/lib/site-connector'
import { getPostTaskKey } from '@/lib/task-data'
import { getMockPostsForTask } from '@/lib/mock-posts'
import { SITE_CONFIG, type TaskKey } from '@/lib/site-config'
import type { SitePost } from '@/lib/site-connector'
import { EditableSiteShell } from '@/editable/shell/EditableSiteShell'
import { pagesContent } from '@/editable/content/pages.content'
import { Ads } from '@/lib/ads'

export const revalidate = 3

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: '/search',
    title: pagesContent.search.metadata.title,
    description: pagesContent.search.metadata.description,
  })
}

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ')
const compactText = (value: unknown) => (typeof value === 'string' ? stripHtml(value).replace(/\s+/g, ' ').trim().toLowerCase() : '')
const getContent = (post: SitePost) => (post.content && typeof post.content === 'object' ? (post.content as Record<string, unknown>) : {})
const compactRaw = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const getImage = (post: SitePost) => {
  const content = getContent(post)
  const media = Array.isArray(post.media) ? post.media.find((item) => typeof item?.url === 'string')?.url : ''
  const images = Array.isArray(content.images) ? (content.images.find((item) => typeof item === 'string') as string | undefined) : ''
  return media || compactRaw(content.featuredImage) || compactRaw(content.image) || compactRaw(content.thumbnail) || images || '/placeholder.svg?height=900&width=1200'
}
const summaryOf = (post: SitePost) => post.summary || compactRaw(getContent(post).description) || compactRaw(getContent(post).excerpt) || ''

const matches = (post: SitePost, query: string, category: string, task: string) => {
  const content = getContent(post)
  const typeText = compactText(content.type)
  if (typeText === 'comment') return false
  const derivedTask = getPostTaskKey(post) || typeText
  if (task && derivedTask !== task) return false
  const categoryText = compactText(content.category)
  const tagsText = compactText(Array.isArray(post.tags) ? post.tags.join(' ') : '')
  if (category && !(categoryText || tagsText).includes(category)) return false
  if (!query) return true
  return [post.title, post.summary, content.description, content.body, content.excerpt, content.category, Array.isArray(post.tags) ? post.tags.join(' ') : '']
    .some((value) => compactText(value).includes(query))
}

function SearchResultCard({ post, index }: { post: SitePost; index: number }) {
  const task = getPostTaskKey(post) as TaskKey | null
  const taskRoute = SITE_CONFIG.tasks.find((item) => item.key === task)?.route
  const href = `${taskRoute || `/${task || 'article'}`}/${post.slug}`
  const image = getImage(post)
  const summary = summaryOf(post)
  const taskLabel = SITE_CONFIG.tasks.find((item) => item.key === task)?.label || 'Post'
  const strong = index % 4 === 0

  return (
    <Link href={href} className={`group overflow-hidden border border-[var(--editable-border)] bg-white shadow-[0_14px_30px_rgba(32,33,24,0.05)] transition duration-300 hover:-translate-y-1 ${strong ? 'xl:col-span-2 xl:grid xl:grid-cols-[260px_minmax(0,1fr)]' : ''}`}>
      <img src={image} alt={post.title} className={`w-full object-cover ${strong ? 'h-full min-h-[230px]' : 'aspect-[16/11]'}`} />
      <div className="p-5 sm:p-6">
        <p className="editable-tech text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--slot4-accent)]">{taskLabel}</p>
        <h2 className="mt-3 line-clamp-3 text-2xl font-semibold leading-[0.98] tracking-[-0.05em] text-[var(--slot4-page-text)]">{post.title}</h2>
        {summary ? <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--slot4-muted-text)]">{summary}</p> : null}
        <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--slot4-accent)]">Open result <ArrowRight className="h-4 w-4" /></span>
      </div>
    </Link>
  )
}

export default async function SearchPage({ searchParams }: { searchParams?: Promise<{ q?: string; category?: string; task?: string; master?: string }> }) {
  const resolved = (await searchParams) || {}
  const query = (resolved.q || '').trim()
  const normalized = query.toLowerCase()
  const category = (resolved.category || '').trim().toLowerCase()
  const task = (resolved.task || '').trim().toLowerCase()
  const useMaster = resolved.master !== '0'
  const feed = await fetchSiteFeed(useMaster ? 1000 : 300, useMaster ? { fresh: true, category: category || undefined, task: task || undefined } : undefined)
  const posts = feed?.posts?.length ? feed.posts : useMaster ? [] : SITE_CONFIG.tasks.filter((item) => item.enabled).flatMap((item) => getMockPostsForTask(item.key))
  const results = posts.filter((post) => matches(post, normalized, category, task)).slice(0, normalized ? 80 : 36)
  const enabledTasks = SITE_CONFIG.tasks.filter((item) => item.enabled)

  return (
    <EditableSiteShell>
      <main className="min-h-screen bg-[var(--slot4-page-bg)] text-[var(--slot4-page-text)]">
        <section className="border-b border-[var(--editable-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.55),transparent)]">
          <div className="mx-auto max-w-[var(--editable-container)] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-8 border border-[var(--editable-border)] bg-white/70 p-6 shadow-[0_24px_60px_rgba(16,16,12,0.10)] md:grid-cols-[0.8fr_1.2fr] lg:p-10">
              <div>
                <p className="editable-tech text-xs font-bold uppercase tracking-[0.26em] text-[var(--slot4-soft-muted-text)]">{pagesContent.search.hero.badge}</p>
                <h1 className="editable-display mt-5 text-[3.2rem] font-semibold uppercase leading-[0.9] tracking-[-0.06em] sm:text-[4.8rem]">{pagesContent.search.hero.title}</h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--slot4-muted-text)]">{pagesContent.search.hero.description}</p>
              </div>
              <form action="/search" className="self-end border border-[var(--editable-border)] bg-[var(--slot4-page-bg)] p-4 sm:p-5">
                <input type="hidden" name="master" value="1" />
                <label className="flex items-center gap-3 border border-[var(--editable-border)] bg-white px-4 py-3">
                  <Search className="h-5 w-5 opacity-45" />
                  <input name="q" defaultValue={query} placeholder={pagesContent.search.hero.placeholder} className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-current/35" />
                </label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 border border-[var(--editable-border)] bg-white px-4 py-3">
                    <Filter className="h-4 w-4 opacity-45" />
                    <input name="category" defaultValue={category} placeholder="Category" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-current/35" />
                  </label>
                  <select name="task" defaultValue={task} className="border border-[var(--editable-border)] bg-white px-4 py-3 text-sm font-semibold outline-none">
                    <option value="">All content types</option>
                    {enabledTasks.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                  </select>
                </div>
                <button className="mt-3 inline-flex h-12 w-full items-center justify-center bg-[var(--slot4-accent)] px-6 text-sm font-bold uppercase tracking-[0.18em] text-[var(--slot4-on-accent)] transition hover:-translate-y-0.5" type="submit">Search</button>
              </form>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[var(--editable-container)] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="editable-tech text-xs font-bold uppercase tracking-[0.24em] text-[var(--slot4-soft-muted-text)]">{results.length} results</p>
              <h2 className="editable-display mt-2 text-[3rem] font-semibold uppercase tracking-[-0.05em]">{query ? `Results for "${query}"` : pagesContent.search.resultsTitle}</h2>
            </div>
            <Link href="/article" className="inline-flex items-center gap-2 border border-[var(--editable-border)] bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.14em]">Browse latest <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="mx-auto max-w-6xl px-4 py-6">
            <Ads slot="in-feed" showLabel eager className="mx-auto w-full" />
          </div>

          {results.length ? (
            <div className="mt-2 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {results.map((post, index) => <SearchResultCard key={post.id || post.slug} post={post} index={index} />)}
            </div>
          ) : (
            <div className="mt-8 border border-dashed border-[var(--editable-border)] bg-white/70 p-10 text-center">
              <p className="text-2xl font-semibold tracking-[-0.04em]">No matching posts found.</p>
              <p className="mt-3 text-sm text-[var(--slot4-muted-text)]">Try a different keyword, task type, or category.</p>
            </div>
          )}
        </section>
      </main>
    </EditableSiteShell>
  )
}
