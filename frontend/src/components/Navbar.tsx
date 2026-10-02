'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="navbar-header">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">Vachana Audio Notes</Link>
        <nav className="navbar-links" aria-label="Main navigation">
          <Link href="/" className={`navbar-link${pathname === '/' ? ' navbar-link-active' : ''}`}>
            Notes
          </Link>
          <Link href="/architecture" className={`navbar-link${pathname === '/architecture' ? ' navbar-link-active' : ''}`}>
            Architecture
          </Link>
        </nav>
      </div>
    </header>
  );
}
