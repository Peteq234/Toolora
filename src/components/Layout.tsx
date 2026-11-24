import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/utils/cn";
import { Link, useLocation, useNavigate } from "@/lib/router";
import { tools, categories, type Tool } from "@/lib/tools";
import { useFavorites } from "@/lib/favorites";
import { useRecent } from "@/lib/recent";
import { usePlatform } from "@/lib/platform";
import { suites } from "@/lib/suites";
import { Icon } from "@/components/Icons";
import { Logo, LogoMark } from "@/components/Logo";
import { PwaInstall } from "@/components/PwaInstall";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useLanguage } from "@/lib/i18n";
import { Container } from "@/components/ui";

/* ------------------------------- search state ------------------------------ */

const SearchContext = createContext<{ openSearch: () => void } | null>(null);

export function useSearch() {
  const value = useContext(SearchContext);
  if (!value) throw new Error("useSearch must be used inside SearchProvider");
  return value;
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }
      const target = event.target as HTMLElement | null;
      const typing =
        target !== null &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      <CommandPalette open={open} onClose={closeSearch} />
    </SearchContext.Provider>
  );
}

/* ------------------------------ command palette ----------------------------- */

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { recents } = useRecent();
  const { isToolListed, toolName } = usePlatform();

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const base = normalized
      ? tools.filter((tool) => {
          if (!isToolListed(tool.slug, tool.category)) return false;
          const category = categories.find((item) => item.id === tool.category);
          return [
            tool.name,
            tool.shortName,
            tool.tagline,
            tool.category,
            tool.metaDescription,
            category?.name,
            category?.description,
            ...tool.keywords,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalized);
        })
      : tools.filter((tool) => isToolListed(tool.slug, tool.category));
    return [...base].sort((a, b) => {
      const recentA = recents.indexOf(a.slug);
      const recentB = recents.indexOf(b.slug);
      if (recentA !== recentB) {
        if (recentA === -1) return 1;
        if (recentB === -1) return -1;
        return recentA - recentB;
      }
      const favA = favorites.includes(a.slug) ? 1 : 0;
      const favB = favorites.includes(b.slug) ? 1 : 0;
      if (favA !== favB) return favB - favA;
      return 0;
    });
  }, [query, favorites, recents, isToolListed, toolName]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 40);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timeout);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const goto = useCallback(
    (tool: Tool) => {
      onClose();
      navigate(`/tools/${tool.slug}`);
    },
    [navigate, onClose]
  );

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((current) => (matches.length ? (current + 1) % matches.length : 0));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((current) => (matches.length ? (current - 1 + matches.length) % matches.length : 0));
      } else if (event.key === "Enter" && matches[active]) {
        event.preventDefault();
        goto(matches[active]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, matches, active, onClose, goto]);

  useEffect(() => {
    if (!open) return;
    const node = document.getElementById(`palette-option-${active}`);
    node?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[10vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-950/80 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search Toolora tools"
        className="animate-pop-in relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.12] bg-ink-850 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4">
          <Icon name="search" size={18} className="shrink-0 text-mist-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-autocomplete="list"
            aria-activedescendant={matches[active] ? `palette-option-${active}` : undefined}
            placeholder={`Search ${tools.length} tools and 7 suites — try 'JSON', 'PDF' or 'BMI'`}
            className="h-14 w-full bg-transparent text-[14px] text-mist-50 outline-none placeholder:text-mist-600"
          />
          <kbd className="hidden shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-1 font-mono text-[10px] text-mist-500 sm:block">
            esc
          </kbd>
        </div>

        {!query.trim() && (
          <div className="border-t border-white/[0.06] bg-ink-925/40 px-3 py-2">
            <p className="mb-1.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-mist-600">Tool suites</p>
            <div className="flex flex-wrap gap-1">
              {suites.map((suite) => (
                <button
                  key={suite.slug}
                  type="button"
                  onClick={() => { onClose(); navigate(`/toolkits/${suite.slug}`); }}
                  className="rounded-md border border-white/8 bg-white/[0.025] px-2 py-1 text-[10.5px] text-mist-400 transition hover:border-brand-400/30 hover:text-brand-200"
                >
                  {suite.name}
                </button>
              ))}
            </div>
          </div>
        )}


        <div
          id="palette-results"
          role="listbox"
          aria-label="Tool results"
          className="max-h-[52vh] overflow-y-auto p-2"
        >
          {matches.length === 0 ? (
            <div className="px-4 py-9 text-center">
              <p className="text-sm font-semibold text-mist-200">No tools match “{query}”</p>
              <p className="mt-1.5 text-[12.5px] text-mist-500">
                Search by task, file type or category. Try one of these:
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {["json", "image", "gradient", "regex", "text"].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10.5px] text-mist-300 transition hover:border-brand-400/30 hover:text-brand-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 rounded-lg border border-white/10 px-3 py-1.5 text-[12px] font-semibold text-mist-300 transition hover:bg-white/5"
              >
                Clear search
              </button>
            </div>
          ) : (
            matches.map((tool, index) => {
              const category = categories.find((item) => item.id === tool.category);
              const selected = index === active;
              return (
                <button
                  key={tool.slug}
                  id={`palette-option-${index}`}
                  role="option"
                  aria-selected={selected}
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => goto(tool)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    selected ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-ink-900",
                      selected ? "text-brand-300" : "text-mist-400"
                    )}
                  >
                    <Icon name={tool.icon} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-mist-100">
                      {toolName(tool)}
                    </span>
                    <span className="block truncate text-[11.5px] text-mist-500">{category?.name}</span>
                  </span>
                  {!query.trim() && recents.includes(tool.slug) && (
                    <span className="hidden items-center gap-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-mist-500 sm:inline-flex">
                      <Icon name="history" size={8} />
                      recent
                    </span>
                  )}
                  {favorites.includes(tool.slug) && (
                    <Icon name="starFilled" size={12} className="text-brand-400" />
                  )}
                  <Icon
                    name="arrowUpRight"
                    size={14}
                    className={selected ? "text-brand-300" : "text-mist-600"}
                  />
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-ink-925/60 px-4 py-2.5">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mist-600">
            {matches.length} {matches.length === 1 ? "tool" : "tools"}
          </span>
          <div className="flex items-center gap-3 font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist-600">
            <span className="hidden sm:inline">↑↓ navigate</span>
            <span className="hidden sm:inline">↵ open</span>
            <span>⌘K / toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- header --------------------------------- */

const navItems = [
  { label: "All tools", href: "/tools" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function Header() {
  const { pathname } = useLocation();
  const { favorites } = useFavorites();
  const { openSearch } = useSearch();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-[90] border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <Container>
        <div className="flex h-[62px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            <span aria-hidden="true" className="hidden h-4 w-px bg-white/10 lg:block" />
            <span className="hidden font-mono text-[9.5px] uppercase tracking-[0.16em] text-mist-500 lg:block">
              {tools.length} {t("nav.freeTools")}
            </span>
          </div>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active =
                item.href === "/tools" ? pathname.startsWith("/tools") : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-white/[0.06] text-mist-50"
                      : "text-mist-400 hover:bg-white/[0.04] hover:text-mist-100"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openSearch}
              className="group hidden h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] pl-3 pr-1.5 text-[12.5px] text-mist-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-mist-200 sm:flex sm:w-[208px]"
              aria-label="Search tools"
            >
              <Icon name="search" size={14} />
              <span className="flex-1 text-left">{t("nav.search")}</span>
              <kbd className="rounded-md border border-white/10 bg-ink-900/80 px-1.5 py-0.5 font-mono text-[9.5px] text-mist-500 group-hover:text-mist-300">
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search tools"
              className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-mist-300 transition hover:bg-white/[0.07] hover:text-mist-50 sm:hidden"
            >
              <Icon name="search" size={16} />
            </button>

            <Link
              href="/favorites"
              aria-label={`Favorites${favorites.length ? `: ${favorites.length} saved` : ""}`}
              aria-current={pathname === "/favorites" ? "page" : undefined}
              className={cn(
                "relative grid size-9 place-items-center rounded-xl border transition",
                pathname === "/favorites"
                  ? "border-brand-400/30 bg-brand-400/10 text-brand-300"
                  : "border-white/10 bg-white/[0.03] text-mist-300 hover:bg-white/[0.07] hover:text-mist-50"
              )}
            >
              <Icon name="star" size={16} />
              {favorites.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-brand-400 px-1 font-mono text-[9px] font-bold leading-none text-ink-950">
                  {favorites.length}
                </span>
              )}
            </Link>

            <LanguageSwitch className="hidden sm:flex" />
            <Link
              href="/tools"
              className="hidden h-9 items-center gap-1.5 rounded-xl bg-brand-400 px-3.5 text-[12.5px] font-bold text-ink-950 transition hover:bg-brand-300 active:scale-[0.985] lg:inline-flex"
            >
              {t("nav.browse")}
              <Icon name="arrowRight" size={14} />
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-mist-300 transition hover:bg-white/[0.07] md:hidden"
            >
              <Icon name={menuOpen ? "close" : "menu"} size={17} />
            </button>
          </div>
        </div>
      </Container>

      {menuOpen && (
        <div id="mobile-nav" className="border-t border-white/[0.06] bg-ink-925/95 md:hidden">
          <Container className="py-3">
            <nav aria-label="Mobile" className="grid gap-1">
              {[...navItems, { label: t("nav.favorites"), href: "/favorites" }].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-2.5 text-[14px] font-medium text-mist-200 transition hover:bg-white/[0.05]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-2 border-t border-white/[0.06] pt-3">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openSearch();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[14px] font-medium text-mist-400 transition hover:bg-white/[0.05]"
              >
                <Icon name="search" size={16} />
                Search the toolkit
              </button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

/* ---------------------------------- footer --------------------------------- */

const footerToolSlugs = [
  "password-generator",
  "word-counter",
  "qr-code-generator",
  "unit-converter",
  "color-palette-generator",
  "stopwatch-timer",
];

function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLanguage();
  return (
    <footer className="mt-20 border-t border-white/[0.07] bg-ink-925">
      <Container className="py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-mist-400">
              A calm, useful toolkit for everyday tasks. Every tool runs in your browser — no
              account, no upload, no fuss.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-400/[0.06] px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-brand-400" />
              <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-200/90">
                Tool inputs stay on your device
              </span>
            </div>
            <p className="mt-4 text-[12px] text-mist-500">
              Questions or a tool idea?{" "}
              <Link href="/contact" className="text-mist-300 underline decoration-white/20 underline-offset-2 hover:text-brand-300">
                Get in touch
              </Link>
            </p>
          </div>

          <nav aria-label="Footer tools" className="lg:col-span-3">
            <h2 className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-mist-500">
              {t("footer.popular")}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {footerToolSlugs.map((slug) => {
                const tool = tools.find((item) => item.slug === slug);
                if (!tool) return null;
                return (
                  <li key={slug}>
                    <Link
                      href={`/tools/${slug}`}
                      className="text-[13px] text-mist-400 transition hover:text-mist-50"
                    >
                      {tool.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav aria-label="Categories" className="lg:col-span-2">
            <h2 className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-mist-500">
              {t("footer.categories")}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/tools?category=${category.id}`}
                    className="text-[13px] text-mist-400 transition hover:text-mist-50"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company and legal" className="lg:col-span-3">
            <h2 className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-mist-500">
              Toolora
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/tools" className="text-[13px] text-mist-400 transition hover:text-mist-50">
                  All tools
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-[13px] text-mist-400 transition hover:text-mist-50">
                  Your favorites
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[13px] text-mist-400 transition hover:text-mist-50">
                  About & principles
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[13px] text-mist-400 transition hover:text-mist-50">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/contact?topic=advertising" className="text-[13px] text-mist-400 transition hover:text-mist-50">
                  Advertise with us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[13px] text-mist-400 transition hover:text-mist-50">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[13px] text-mist-400 transition hover:text-mist-50">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href="/admin" className="inline-flex items-center gap-1.5 text-[13px] text-mist-500 transition hover:text-brand-200">
                  <Icon name="lock" size={11} />
                  {t("footer.admin")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-6 rounded-md" />
            <p className="text-[11.5px] text-mist-500">
              © {year} Toolora. Free tools, built with restraint.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PwaInstall compact />
            <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-mist-600">
              No analytics · No ads · Just tools
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

/* ------------------------------- announcements ----------------------------- */

function AnnouncementBanner() {
  const { config } = usePlatform();
  const announcement = config.announcements[0];
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!announcement) return;
    try {
      setDismissed(window.localStorage.getItem(`toolora:announcement:${announcement.id}`) === "dismissed");
    } catch {
      setDismissed(false);
    }
  }, [announcement]);

  if (!announcement || dismissed) return null;

  return (
    <div className="border-b border-brand-400/15 bg-brand-400/[0.055]">
      <Container className="flex items-start gap-2.5 py-2.5">
        <Icon name="info" size={14} className="mt-0.5 shrink-0 text-brand-300" />
        <p className="min-w-0 flex-1 text-[11.5px] leading-relaxed text-mist-300">
          <span className="font-semibold text-mist-100">{announcement.title}</span>
          <span className="mx-1.5 text-mist-600">·</span>
          {announcement.body}
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            try { window.localStorage.setItem(`toolora:announcement:${announcement.id}`, "dismissed"); } catch { /* ignore */ }
          }}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded p-1 text-mist-500 transition hover:bg-white/5 hover:text-mist-200"
        >
          <Icon name="close" size={13} />
        </button>
      </Container>
    </div>
  );
}

/* ---------------------------------- layout --------------------------------- */

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-brand-400 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ink-950"
      >
        Skip to content
      </a>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[560px] bg-[radial-gradient(58%_58%_at_50%_0%,rgba(199,240,95,0.075),transparent_72%)]"
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <AnnouncementBanner />
        <main id="content" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
