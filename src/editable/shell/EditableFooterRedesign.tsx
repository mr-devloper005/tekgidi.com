'use client'

import Image from 'next/image'
import Link from 'next/link'
import { SITE_CONFIG } from '@/lib/site-config'
import { useEditableLocalAuthSession } from '@/editable/components/EditableLocalAuthForms'

export function EditableFooterRedesign() {
  const year = new Date().getFullYear()
  const { session, logout } = useEditableLocalAuthSession()

  return (
    <footer className="mt-auto bg-[var(--editable-footer-bg)] text-[var(--editable-footer-text)]">
      <div className="mx-auto max-w-[var(--editable-container)] px-4 py-14 sm:px-6 lg:px-8">
        <p className="mx-auto max-w-4xl text-sm leading-7 text-white/82">
          Browse local opportunities, featured listings, business profiles, and practical resources through one clear marketplace-style experience.
        </p>

        <div className="mt-14 grid gap-10 border-t border-white/10 pt-12 md:grid-cols-[1.2fr_0.9fr_1fr]">
          <div>
            <Link href="/" className="editable-tech flex items-center gap-4 text-[1.1rem] font-medium uppercase tracking-[0.4em] text-white">
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-white/12 bg-white/6 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                <Image src="/favicon.png" alt={`${SITE_CONFIG.name} logo`} fill sizes="56px" className="object-contain p-1.5" />
              </span>
              <span>{SITE_CONFIG.name.replace(/\s+/g, '.')}</span>
            </Link>
            <p className="mt-4 max-w-sm text-base leading-8 text-white/64">
              A clean destination for discovery, comparison, and outreach.
            </p>
          </div>

          <div>
            <h3 className="editable-tech text-xs font-bold uppercase tracking-[0.22em] text-white/56">Company</h3>
            <div className="mt-5 grid gap-3">
              <Link href="/about" className="text-sm text-white/86 transition hover:text-white">About</Link>
              <Link href="/contact" className="text-sm text-white/86 transition hover:text-white">Contact</Link>
              {session ? (
                <>
                  <Link href="/create" className="text-sm text-white/86 transition hover:text-white">Create</Link>
                  <button type="button" onClick={logout} className="text-left text-sm text-white/86 transition hover:text-white">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-white/86 transition hover:text-white">Login</Link>
                  <Link href="/signup" className="text-sm text-white/86 transition hover:text-white">Sign up</Link>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="editable-tech text-xs font-bold uppercase tracking-[0.22em] text-white/56">Get updates</h3>
            <form action="/contact" className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center md:flex-col">
              <input type="email" placeholder="Email Address" className="h-12 flex-1 border border-white/16 bg-white/14 px-4 text-sm text-white outline-none placeholder:text-white/42" />
              <button className="h-12 border border-white/30 px-6 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black">
                Sign Up
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs uppercase tracking-[0.12em] text-white/42">
          &copy; {year} {SITE_CONFIG.name}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
