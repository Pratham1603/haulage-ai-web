import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV_GROUPS } from "../../content/site";
import { ThemeToggle } from "../../theme";
import { Logo } from "./Logo";

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const Drop = ({ item, pathname }) => {
  const [open, setOpen] = useState(false);
  const active = item.children.some((c) => pathname === c.to || pathname.startsWith(c.to + "/"));
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        data-testid={`nav-${slugify(item.label)}`}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
          active ? "text-heading" : "text-muted-foreground"
        }`}
      >
        {item.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 w-72 rounded-xl border bg-popover p-2 shadow-md">
          {item.children.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              data-testid={`nav-${slugify(item.label)}-${slugify(c.label)}`}
              onClick={() => setOpen(false)}
              aria-current={pathname === c.to ? "page" : undefined}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent ${
                pathname === c.to ? "font-semibold text-heading" : "text-muted-foreground"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const NavItem = ({ item, pathname }) => {
  if (item.children) return <Drop item={item} pathname={pathname} />;
  const active = pathname === item.to || pathname.startsWith(item.to + "/");
  return (
    <Link
      to={item.to}
      data-testid={`nav-${slugify(item.label)}`}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
        active ? "text-heading" : "text-muted-foreground"
      }`}
    >
      {item.label}
    </Link>
  );
};

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur" data-testid="navbar">
      <nav
        className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-2 px-5 md:px-8"
        aria-label="Main navigation"
      >
        <Logo testId="navbar-logo" />
        <div className="ml-6 hidden items-center gap-0.5 lg:flex">
          {NAV_GROUPS.map((item) => (
            <NavItem key={item.label} item={item} pathname={pathname} />
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle testId="nav-theme-toggle" />
          <Link
            to="/login"
            data-testid="nav-login-link"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent sm:inline-block"
          >
            Login
          </Link>
          <Link
            to="/contact"
            data-testid="nav-book-demo-btn"
            aria-current={pathname === "/contact" || pathname === "/book-a-demo" ? "page" : undefined}
            className={`hidden rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 sm:inline-block ${
              pathname === "/contact" || pathname === "/book-a-demo"
                ? "bg-primary/80 text-primary-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            Book a Demo
          </Link>
          <button
            type="button"
            data-testid="nav-mobile-menu-btn"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border lg:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="border-t bg-background lg:hidden" data-testid="nav-mobile-menu">
          <div className="mx-auto max-h-[70vh] w-full max-w-[1200px] overflow-y-auto px-5 py-4">
            {NAV_GROUPS.map((item) =>
              item.children ? (
                <details key={item.label} className="border-b py-1">
                  <summary className="cursor-pointer list-none rounded-lg px-2 py-2.5 text-sm font-semibold text-heading">
                    {item.label}
                  </summary>
                  <div className="pb-2 pl-3">
                    {item.children.map((c) => (
                      <Link
                        key={c.to}
                        to={c.to}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-accent"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block border-b px-2 py-3 text-sm font-semibold text-heading"
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="flex items-center gap-3 pt-4">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                data-testid="nav-mobile-login-link"
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
              >
                Login
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileOpen(false)}
                data-testid="nav-mobile-book-demo-btn"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
