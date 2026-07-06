'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogIn, Menu, PlusCircle, Search, UserPlus, X } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { useEditableLocalAuthSession } from '@/editable/components/EditableLocalAuthForms'

const hiddenFrontFacingTasks = new Set(['classified', 'profile'])

export function EditableNavbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { session, logout } = useEditableLocalAuthSession()
  const navItems = useMemo(
    () =>
      SITE_CONFIG.tasks
        .filter((task) => task.enabled && !hiddenFrontFacingTasks.has(task.key))
        .slice(0, 3)
        .map((task) => ({ label: task.label.toUpperCase(), href: task.route })),
    []
  )

  const mobileItems = [{ label: 'HOME', href: '/' }, ...navItems, { label: 'CONTACT', href: '/contact' }]

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--editable-nav-bg)] text-[var(--editable-nav-text)]">
      <nav className="mx-auto flex min-h-[60px] w-full max-w-[var(--editable-container)] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="editable-tech flex shrink-0 items-center gap-3 text-[0.95rem] font-medium uppercase tracking-[0.42em] text-[var(--editable-nav-text)]">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[0.7rem] border border-white/12 bg-white/6 p-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
            <Image src="/favicon.png" alt={`${SITE_CONFIG.name} logo`} fill sizes="40px" className="object-contain p-1" />
          </span>
          <span className="hidden sm:inline">{SITE_CONFIG.name.replace(/\s+/g, '.')}</span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-10 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`editable-tech text-sm font-bold tracking-[0.14em] transition ${
                  active ? 'text-[var(--slot4-on-accent)]' : 'text-white/78 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <form action="/search" className="hidden items-center gap-2 md:flex">
            <button type="submit" className="flex h-8 w-8 items-center justify-center text-white/86 transition hover:text-white" aria-label="Search">
              <Search className="h-4.5 w-4.5" />
            </button>
          </form>

          {session ? (
            <>
              <Link href="/create" className="hidden items-center gap-2 border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white sm:inline-flex">
                <PlusCircle className="h-3.5 w-3.5" /> Create
              </Link>
              <button type="button" onClick={logout} className="hidden text-xs font-bold uppercase tracking-[0.14em] text-white/72 transition hover:text-white sm:inline-flex">
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="hidden h-9 w-9 items-center justify-center rounded-[0.45rem] border border-[var(--slot4-accent)] bg-[var(--slot4-dark-bg)] text-white shadow-[0_0_0_1px_rgba(241,240,228,0.08)] sm:flex" aria-label="Login">
              <UserPlus className="h-4 w-4" />
            </Link>
          )}

          <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-9 w-9 items-center justify-center border border-white/20 text-white lg:hidden" aria-label="Toggle menu">
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-white/10 bg-[var(--editable-nav-bg)] px-4 py-5 lg:hidden">
          <form action="/search" className="mb-4 flex items-center gap-3 border border-white/12 bg-white/5 px-4 py-3">
            <Search className="h-4 w-4 text-white/70" />
            <input name="q" type="search" placeholder="Search the market" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" />
          </form>
          <div className="grid gap-2">
            {mobileItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`editable-tech border px-4 py-3 text-sm font-bold tracking-[0.14em] ${
                    active ? 'border-white/28 bg-white/8 text-white' : 'border-white/10 text-white/78'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            {session ? (
              <>
                <Link href="/create" onClick={() => setOpen(false)} className="editable-tech border border-white/10 px-4 py-3 text-sm font-bold tracking-[0.14em] text-white/78">
                  CREATE
                </Link>
                <button type="button" onClick={logout} className="editable-tech border border-white/10 px-4 py-3 text-left text-sm font-bold tracking-[0.14em] text-white/78">
                  LOGOUT
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="editable-tech border border-white/10 px-4 py-3 text-sm font-bold tracking-[0.14em] text-white/78">
                  <span className="inline-flex items-center gap-2"><LogIn className="h-4 w-4" /> LOGIN</span>
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="editable-tech border border-white/10 px-4 py-3 text-sm font-bold tracking-[0.14em] text-white/78">
                  <span className="inline-flex items-center gap-2"><UserPlus className="h-4 w-4" /> SIGN UP</span>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
