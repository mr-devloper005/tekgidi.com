import Link from 'next/link'
import { ArrowRight, BadgeDollarSign, Bot, ChevronRight, MapPin, Search, Shield } from 'lucide-react'
import type { SitePost } from '@/lib/site-connector'
import type { HomeTimeSection } from '@/lib/task-data'
import type { TaskKey } from '@/lib/site-config'
import { SITE_CONFIG } from '@/lib/site-config'
import { getEditableExcerpt, getEditablePostImage, postHref } from '@/editable/cards/PostCards'

type HomeSectionProps = {
  primaryTask: TaskKey
  primaryRoute: string
  posts: SitePost[]
  timeSections: HomeTimeSection[]
}

const container = 'mx-auto w-full max-w-[var(--editable-container)] px-4 sm:px-6 lg:px-8'

function dedupePosts(posts: SitePost[]) {
  const seen = new Set<string>()
  const out: SitePost[] = []
  for (const post of posts) {
    const key = post.slug || post.id || post.title
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(post)
  }
  return out
}

function postCategory(post?: SitePost | null) {
  const content = post?.content && typeof post.content === 'object' ? (post.content as Record<string, unknown>) : {}
  return (typeof content.category === 'string' && content.category) || post?.tags?.[0] || 'Featured'
}

function postMeta(post?: SitePost | null) {
  const content = post?.content && typeof post.content === 'object' ? (post.content as Record<string, unknown>) : {}
  return {
    location:
      (typeof content.location === 'string' && content.location) ||
      (typeof content.address === 'string' && content.address) ||
      (typeof content.city === 'string' && content.city) ||
      'Regional listing',
    price:
      (typeof content.price === 'string' && content.price) ||
      (typeof content.amount === 'string' && content.amount) ||
      (typeof content.budget === 'string' && content.budget) ||
      'Open offer',
  }
}

const partnerMarks = ['LOCAL BOARD', 'TRADE DESK', 'GARAGE LIST', 'STATUS HUB', 'GROW GRID']

function HomeSearchHero({ posts, primaryRoute }: { posts: SitePost[]; primaryRoute: string }) {
  const lead = posts[0]
  const image = getEditablePostImage(lead)
  const meta = postMeta(lead)
  const chips = ['Retail space', 'Auto service', 'Studio', 'Workshop', 'Consulting', 'Supply']

  return (
    <section className="bg-[var(--slot4-cream)]">
      <div className={`${container} grid gap-10 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-16`}>
        <div>
          <p className="editable-tech text-xs font-bold uppercase tracking-[0.26em] text-[var(--slot4-soft-muted-text)]">
            Follow the market
          </p>
          <h1 className="editable-display mt-6 max-w-xl text-[3.25rem] font-semibold uppercase leading-[0.9] tracking-[-0.06em] text-[var(--slot4-page-text)] sm:text-[4.75rem]">
            Find what local owners need next
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--slot4-muted-text)]">
            Search active classifieds, standout business profiles, and timely opportunities in one polished local marketplace.
          </p>

          <form action="/search" className="mt-8 flex max-w-xl overflow-hidden rounded-[1rem] border border-[var(--editable-border)] bg-white shadow-[0_18px_40px_rgba(32,33,24,0.08)]">
            <div className="flex flex-1 items-center gap-3 px-5">
              <Search className="h-5 w-5 text-[var(--slot4-soft-muted-text)]" />
              <input
                name="q"
                placeholder="Search listings, services, or business profiles"
                className="h-14 min-w-0 flex-1 bg-transparent text-sm text-[var(--slot4-page-text)] outline-none"
              />
            </div>
            <button className="flex h-14 w-14 items-center justify-center bg-[#4a82eb] text-white transition hover:brightness-95" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
          </form>

          <div className="mt-5">
            <p className="text-sm text-[var(--slot4-muted-text)]">Popular searches</p>
            <div className="mt-3 flex max-w-xl flex-wrap gap-2.5">
              {chips.map((chip) => (
                <Link key={chip} href={primaryRoute} className="rounded-full border border-[var(--editable-border)] px-4 py-2 text-sm text-[var(--slot4-muted-text)] transition hover:border-[var(--slot4-accent)] hover:text-[var(--slot4-accent)]">
                  {chip}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[1.2rem] bg-[var(--slot4-media-bg)] shadow-[0_26px_70px_rgba(16,16,12,0.18)]">
            <img src={image} alt={lead?.title || SITE_CONFIG.name} className="aspect-[5/4] w-full object-cover" />
          </div>
          <div className="absolute bottom-4 left-4 right-4 rounded-[0.85rem] bg-white px-4 py-3 shadow-[0_16px_32px_rgba(32,33,24,0.12)] sm:left-6 sm:right-12">
            <div className="flex items-center gap-4">
              <span className="editable-tech inline-flex bg-black px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white">For Sale</span>
              <p className="line-clamp-1 flex-1 text-base font-medium text-[var(--slot4-page-text)]">{lead?.title || 'Featured opportunity'}</p>
              <span className="text-2xl font-bold text-[var(--slot4-page-text)]">{meta.price}</span>
              <ChevronRight className="h-5 w-5 text-[#4a82eb]" />
            </div>
            <p className="mt-2 text-sm text-[var(--slot4-muted-text)]">{meta.location}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function MarketBand() {
  return (
    <section className="bg-[var(--slot4-warm)]">
      <div className={`${container} py-12 sm:py-14`}>
        <h2 className="mx-auto max-w-4xl text-center text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--slot4-page-text)] sm:text-[3.2rem]">
          Search listings from owners, specialists, and service providers all in one place.
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {partnerMarks.map((item, index) => (
            <div key={item} className="flex min-h-[120px] items-center justify-center border border-[var(--editable-border)] bg-[rgba(255,255,255,0.45)] px-4 text-center">
              <span className={`editable-tech text-2xl font-bold uppercase tracking-[0.14em] ${index === 2 ? 'text-[#8d743d]' : 'text-[var(--slot4-page-text)]'}`}>{item}</span>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-lg text-[var(--slot4-page-text)]">
          <span className="font-semibold">Businesses:</span> add your profile and stay easy to discover.
        </p>
      </div>
    </section>
  )
}

function FeaturedGrid({ primaryTask, primaryRoute, posts }: { primaryTask: TaskKey; primaryRoute: string; posts: SitePost[] }) {
  const featured = posts.slice(0, 6)
  if (!featured.length) return null

  return (
    <section className="bg-[var(--slot4-cream)]">
      <div className={`${container} py-14 sm:py-16`}>
        <h2 className="editable-display text-[3rem] font-semibold uppercase leading-none tracking-[-0.05em] text-[var(--slot4-page-text)] sm:text-[4.25rem]">
          Featured Listings
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((post, index) => {
            const meta = postMeta(post)
            return (
              <Link
                key={post.id || post.slug || post.title}
                href={postHref(primaryTask, post, primaryRoute)}
                className="group overflow-hidden rounded-[1rem] border border-[var(--editable-border)] bg-white shadow-[0_12px_26px_rgba(32,33,24,0.06)] transition duration-300 hover:-translate-y-1"
              >
                <div className={`relative overflow-hidden ${index % 3 === 0 ? 'aspect-[16/11]' : 'aspect-[4/3]'}`}>
                  <img src={getEditablePostImage(post)} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                  <div className="absolute left-3 top-3 flex items-center gap-2 bg-[rgba(32,33,24,0.72)] px-3 py-2 text-sm text-white">
                    <MapPin className="h-4 w-4" />
                    <span>{meta.location}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-[1.1rem] font-semibold leading-snug text-[var(--slot4-page-text)]">{post.title}</h3>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--slot4-accent)]">{postCategory(post)}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="editable-tech bg-black px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white">For Sale</span>
                    <span className="text-[1.9rem] font-bold tracking-[-0.03em] text-[var(--slot4-page-text)]">{meta.price}</span>
                  </div>
                  <button className="mt-4 w-full bg-[#4a82eb] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:brightness-95">
                    Contact Seller
                  </button>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-8">
          <Link href={primaryRoute} className="inline-flex border border-[#4a82eb] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#4a82eb] transition hover:bg-[#4a82eb] hover:text-white">
            Show More
          </Link>
        </div>
      </div>
    </section>
  )
}

function StatsBand() {
  const stats = [
    ['1,040+', 'Listings'],
    ['10,307', 'Markets'],
    ['778', 'Active brands'],
  ]
  return (
    <section className="bg-[var(--slot4-cream)]">
      <div className={`${container} pb-12`}>
        <div className="grid gap-6 bg-black px-8 py-8 text-white md:grid-cols-3">
          {stats.map(([value, label]) => (
            <div key={label} className="flex items-center gap-6">
              <Shield className="h-11 w-11 text-[#4a82eb]" />
              <div>
                <p className="text-5xl font-bold tracking-[-0.05em]">{value}</p>
                <p className="mt-1 text-lg text-white/84">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AskSection({ posts, primaryTask, primaryRoute }: { posts: SitePost[]; primaryTask: TaskKey; primaryRoute: string }) {
  const list = posts.slice(0, 7)
  return (
    <section className="bg-white">
      <div className={`${container} grid gap-10 py-14 lg:grid-cols-[0.74fr_1.26fr] lg:items-center`}>
        <div>
          <h2 className="editable-display text-[3rem] font-semibold leading-[0.88] tracking-[-0.06em] text-[var(--slot4-page-text)] sm:text-[4.1rem]">
            Ask
            <br />
            Compass
          </h2>
          <p className="mt-5 max-w-sm text-lg leading-8 text-[var(--slot4-muted-text)]">
            Use quick prompts to move through local opportunities, pricing ideas, and profile research faster.
          </p>
          <Link href={primaryRoute} className="mt-8 inline-flex bg-[#4a82eb] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:brightness-95">
            Learn More
          </Link>
        </div>

        <div className="grid gap-2.5">
          {list.map((post, index) => (
            <Link
              key={post.id || post.slug || post.title}
              href={postHref(primaryTask, post, primaryRoute)}
              className={`flex items-center justify-between gap-4 px-4 py-4 text-lg transition ${
                index === 4
                  ? 'border border-[#4a82eb] bg-[#eaf1ff] font-semibold text-[var(--slot4-page-text)]'
                  : 'text-[var(--slot4-soft-muted-text)] hover:text-[var(--slot4-page-text)]'
              }`}
            >
              <span className="line-clamp-1">{post.title}</span>
              {index === 4 ? <Bot className="h-5 w-5 text-[#4a82eb]" /> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function WorthSection({ posts, primaryTask, primaryRoute }: { posts: SitePost[]; primaryTask: TaskKey; primaryRoute: string }) {
  const cards = posts.slice(6, 10)
  if (!cards.length) return null
  return (
    <section className="bg-[var(--slot4-warm)]">
      <div className={`${container} grid gap-10 py-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-center`}>
        <div>
          <BadgeDollarSign className="h-12 w-12 text-[#2da44e]" />
          <h2 className="editable-display mt-5 text-[3rem] font-semibold leading-[0.9] tracking-[-0.06em] text-[var(--slot4-page-text)] sm:text-[4rem]">
            What&apos;s that
            <br />
            worth?
          </h2>
          <p className="mt-5 max-w-sm text-lg leading-8 text-[var(--slot4-muted-text)]">
            Track value signals, compare current offers, and keep an eye on the categories that matter most to your business.
          </p>
          <Link href={primaryRoute} className="mt-8 inline-flex bg-[#4a82eb] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:brightness-95">
            Track Yours Now
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((post, index) => (
            <Link
              key={post.id || post.slug || post.title}
              href={postHref(primaryTask, post, primaryRoute)}
              className={`group overflow-hidden border border-[var(--editable-border)] bg-white transition duration-300 hover:-translate-y-1 ${
                index === 0 ? 'sm:col-span-2 sm:grid sm:grid-cols-[220px_minmax(0,1fr)]' : ''
              }`}
            >
              <img src={getEditablePostImage(post)} alt={post.title} className={`h-full w-full object-cover ${index === 0 ? 'aspect-[16/10] sm:aspect-auto sm:min-h-[210px]' : 'aspect-[16/11]'}`} />
              <div className="p-5">
                <p className="editable-tech text-xs font-bold uppercase tracking-[0.14em] text-[var(--slot4-accent)]">{postCategory(post)}</p>
                <h3 className="mt-2 text-2xl font-semibold leading-tight text-[var(--slot4-page-text)]">{post.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--slot4-muted-text)]">{getEditableExcerpt(post, 150)}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[#4a82eb]">
                  View market <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function CompactCollections({ primaryTask, primaryRoute, timeSections }: { primaryTask: TaskKey; primaryRoute: string; timeSections: HomeTimeSection[] }) {
  const groups = timeSections.filter((section) => section.posts.length).slice(0, 2)
  if (!groups.length) return null
  return (
    <section className="bg-[var(--slot4-cream)]">
      <div className={`${container} py-14`}>
        <div className="grid gap-8 xl:grid-cols-2">
          {groups.map((section, groupIndex) => (
            <div key={section.key} className="border border-[var(--editable-border)] bg-white p-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="editable-tech text-xs font-bold uppercase tracking-[0.14em] text-[var(--slot4-soft-muted-text)]">
                    {groupIndex === 0 ? 'New this week' : 'Popular right now'}
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold leading-none tracking-[-0.04em] text-[var(--slot4-page-text)]">
                    {groupIndex === 0 ? 'Fresh arrivals' : 'Market watch'}
                  </h3>
                </div>
                <Link href={section.href || primaryRoute} className="text-sm font-bold uppercase tracking-[0.14em] text-[#4a82eb]">
                  See all
                </Link>
              </div>

              <div className="mt-6 grid gap-4">
                {section.posts.slice(0, 4).map((post, index) => (
                  <Link
                    key={post.id || post.slug || post.title}
                    href={postHref(primaryTask, post, primaryRoute)}
                    className={`grid gap-4 border border-[var(--editable-border)] p-3 transition duration-300 hover:border-[var(--slot4-accent)] ${
                      index === 0 ? 'sm:grid-cols-[180px_minmax(0,1fr)]' : 'sm:grid-cols-[110px_minmax(0,1fr)]'
                    }`}
                  >
                    <img src={getEditablePostImage(post)} alt={post.title} className={`w-full object-cover ${index === 0 ? 'aspect-[16/11]' : 'aspect-square'}`} />
                    <div className="min-w-0">
                      <p className="editable-tech text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--slot4-accent)]">{postCategory(post)}</p>
                      <h4 className="mt-2 line-clamp-2 text-xl font-semibold leading-snug text-[var(--slot4-page-text)]">{post.title}</h4>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--slot4-muted-text)]">{getEditableExcerpt(post, 95)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function EditableHomeHero({ primaryRoute, posts }: HomeSectionProps) {
  return <HomeSearchHero posts={posts} primaryRoute={primaryRoute} />
}

export function EditableStoryRail(_props: HomeSectionProps) {
  return <MarketBand />
}

export function EditableMagazineSplit({ primaryTask, primaryRoute, posts }: HomeSectionProps) {
  return <FeaturedGrid primaryTask={primaryTask} primaryRoute={primaryRoute} posts={posts} />
}

export function EditableTimeCollections({ primaryTask, primaryRoute, posts, timeSections }: HomeSectionProps) {
  const merged = dedupePosts([...posts, ...timeSections.flatMap((section) => section.posts)])
  return (
    <>
      <StatsBand />
      <AskSection posts={merged} primaryTask={primaryTask} primaryRoute={primaryRoute} />
      <WorthSection posts={merged} primaryTask={primaryTask} primaryRoute={primaryRoute} />
      <CompactCollections primaryTask={primaryTask} primaryRoute={primaryRoute} timeSections={timeSections} />
    </>
  )
}

export function EditableHomeCta() {
  return (
    <section className="bg-[var(--slot4-dark-bg)]">
      <div className={`${container} py-16 text-center`}>
        <p className="editable-tech text-xs font-bold uppercase tracking-[0.28em] text-white/54">Start listing</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-[3rem] font-semibold leading-[0.95] tracking-[-0.05em] text-white sm:text-[4rem]">
          Bring your next offer, profile, or announcement into the local spotlight.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/create" className="bg-white px-7 py-3 text-sm font-bold uppercase tracking-[0.16em] text-black transition hover:opacity-90">
            Create a post
          </Link>
          <Link href="/contact" className="border border-white/28 px-7 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  )
}
