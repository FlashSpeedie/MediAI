'use client';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Stethoscope, History, MessageSquare, User,
  Settings, LogOut, ChevronDown, UserCircle,
  LayoutDashboard, Heart, HelpCircle, Info,
  Sparkles, Menu, X, Pill, Camera
} from 'lucide-react';
import Image from 'next/image';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { href: '/chat', label: 'New Session', icon: MessageSquare },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/cabinet', label: 'Medicine Cabinet', icon: Pill },
    { href: '/scan', label: 'Scan Medicine', icon: Camera },
    { href: '/about', label: 'About', icon: Info },
    { href: '/how-it-works', label: 'How it Works', icon: HelpCircle },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled
        ? 'glass border-b border-warm-border shadow-card'
        : 'bg-white/95 border-b border-warm-border'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-glow-teal group-hover:scale-105 transition-transform">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-navy hidden sm:block">
            Medi<span className="text-teal">AI</span>
          </span>
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:text-navy hover:bg-warm-gray transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Center nav — only when logged in (desktop) */}
        {session && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname?.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-teal-light text-teal-dark'
                      : 'text-gray-600 hover:text-navy hover:bg-warm-gray'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Mobile menu drawer */}
        {session && mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
        )}
        {session && mobileMenuOpen && (
          <aside
            id="mobile-menu-panel"
            className="md:hidden fixed top-0 right-0 z-50 w-full max-w-sm h-full bg-white shadow-floating border-l border-warm-border animate-slide-in"
            role="dialog"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between p-4 border-b border-warm-border">
              <h2 className="font-display font-semibold text-navy">Menu</h2>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-lg text-gray-500 hover:text-navy hover:bg-warm-gray transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname?.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobileMenu}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors',
                      isActive
                        ? 'bg-teal-light text-teal-dark'
                        : 'text-gray-600 hover:text-navy hover:bg-warm-gray'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {session ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl border border-warm-border hover:border-teal/40 hover:bg-teal-light/30 transition-all group">
                  {/* Avatar */}
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name ?? 'User'}
                      width={32}
                      height={32}
                      className="rounded-full ring-2 ring-white"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-navy flex items-center justify-center text-white text-xs font-bold">
                      {(session.user?.name ?? session.user?.email ?? 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
                    {session.user?.name?.split(' ')[0] ?? 'Account'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-data-[state=open]:rotate-180 transition-transform" />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 min-w-[220px] bg-white rounded-2xl shadow-floating border border-warm-border p-1.5 animate-fade-in"
                >
                  {/* User info header */}
                  <div className="px-3 py-2.5 mb-1">
                    <div className="flex items-center gap-3">
                      {session.user?.image ? (
                        <Image src={session.user.image} alt="" width={40} height={40} className="rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-navy flex items-center justify-center text-white font-bold">
                          {(session.user?.name ?? 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{session.user?.name ?? 'User'}</p>
                        <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-warm-border mx-1 mb-1" />

                  {/* Menu items */}
                  {[
                    { href: '/account', icon: UserCircle, label: 'Account', desc: 'Profile & settings' },
                    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', desc: 'Your sessions' },
                    { href: '/profile', icon: Heart, label: 'Health Profile', desc: 'Medical info' },
                  ].map(({ href, icon: Icon, label, desc }) => (
                    <DropdownMenu.Item key={href} asChild>
                      <Link
                        href={href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-warm-gray text-sm transition-colors outline-none cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-warm-gray group-hover:bg-teal-light flex items-center justify-center transition-colors">
                          <Icon className="w-4 h-4 text-gray-500 group-hover:text-teal transition-colors" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                      </Link>
                    </DropdownMenu.Item>
                  ))}

                  <div className="h-px bg-warm-border mx-1 my-1" />

                  <DropdownMenu.Item asChild>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm transition-colors outline-none cursor-pointer text-red-500 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                        <LogOut className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-navy border border-warm-border rounded-xl hover:bg-warm-gray transition"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-700 rounded-xl hover:opacity-90 transition shadow-glow-teal"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
