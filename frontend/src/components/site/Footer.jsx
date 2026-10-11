import { Link } from "react-router-dom";
import { Linkedin, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { FOOTER_COLS } from "../../content/site";
import { Logo } from "./Logo";

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const Footer = () => (
  <footer className="border-t border-transparent bg-footer text-footer-foreground dark:border-[hsl(var(--border))]" data-testid="footer">
    <div className="mx-auto w-full max-w-[1200px] px-5 py-14 md:px-8 md:py-16">
      <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo dark testId="footer-logo" />
          <p className="mt-4 max-w-xs text-sm text-footer-foreground/70">
            AI agents run your logistics back office. Built for Indian freight.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-footer-foreground/70">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" aria-hidden="true" />
              <a href="mailto:hello@haulage.ai" className="hover:text-footer-foreground">
                hello@haulage.ai (Placeholder)
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>+91 22 0000 0000 (Placeholder)</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>Mumbai, India (Placeholder)</span>
            </li>
          </ul>
          <div className="mt-6 flex gap-2">
            {[
              { icon: Linkedin, label: "LinkedIn (placeholder)" },
              { icon: Twitter, label: "X (placeholder)" },
              { icon: Youtube, label: "YouTube (placeholder)" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                onClick={(e) => e.preventDefault()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-footer-foreground/20 text-footer-foreground/70 transition-colors hover:text-footer-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {FOOTER_COLS.map((col) => (
          <nav key={col.title} aria-label={`Footer - ${col.title}`}>
            <h3 className="text-sm font-semibold text-footer-foreground">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    data-testid={`footer-${slugify(col.title)}-${slugify(l.label)}`}
                    className="text-sm text-footer-foreground/70 transition-colors hover:text-footer-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mt-12 flex flex-col gap-2 border-t border-footer-foreground/15 pt-6 text-xs text-footer-foreground/60 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Haulage AI. All rights reserved. (Placeholder company details)</p>
        <p>All logos, metrics and testimonials on this site are placeholders.</p>
      </div>
    </div>
  </footer>
);
