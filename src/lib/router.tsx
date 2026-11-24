import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

export type AppLocation = {
  pathname: string;
  search: string;
  hash: string;
};

type RouterValue = {
  location: AppLocation;
  navigate: (to: string, options?: { replace?: boolean }) => void;
};

const RouterContext = createContext<RouterValue | null>(null);

export function normalizePath(pathname: string): string {
  let path = pathname || "/";
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path || "/";
}

function isFileProtocol(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "file:";
}

/**
 * When the single-file build is opened straight from disk, history.pushState is not
 * permitted. In that case routes live in the URL hash (#/tools/word-counter) so the
 * whole site still works offline without a server.
 */
function parseHashRoute(): AppLocation | null {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw.startsWith("/")) return null;
  const url = new URL(raw, "http://file.local");
  return {
    pathname: normalizePath(url.pathname),
    search: url.search,
    hash: url.hash,
  };
}

function readLocation(): AppLocation {
  if (isFileProtocol()) {
    return parseHashRoute() ?? { pathname: "/", search: "", hash: "" };
  }
  return {
    pathname: normalizePath(window.location.pathname),
    search: window.location.search,
    hash: window.location.hash,
  };
}

function scrollToHash(hash: string): boolean {
  if (!hash) return false;
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return false;
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<AppLocation>(() =>
    typeof window === "undefined" ? { pathname: "/", search: "", hash: "" } : readLocation()
  );

  useEffect(() => {
    const onPopState = () => setLocation(readLocation());
    const onHashChange = () => {
      if (isFileProtocol()) setLocation(readLocation());
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  useEffect(() => {
    if (location.hash) {
      const frame = window.requestAnimationFrame(() => {
        if (!scrollToHash(location.hash)) window.scrollTo({ top: 0, left: 0 });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname, location.search, location.hash]);

  const navigate = useCallback<RouterValue["navigate"]>((to, options) => {
    if (/^(https?:|mailto:|tel:)/i.test(to)) {
      window.location.href = to;
      return;
    }

    let url: URL;
    try {
      url = new URL(to, isFileProtocol() ? "http://file.local" : window.location.origin);
    } catch {
      window.location.href = to;
      return;
    }

    if (!isFileProtocol() && url.origin !== window.location.origin) {
      window.location.href = url.toString();
      return;
    }

    const next: AppLocation = {
      pathname: normalizePath(url.pathname),
      search: url.search,
      hash: url.hash,
    };

    const same =
      next.pathname === location.pathname &&
      next.search === location.search &&
      next.hash === location.hash;

    if (same) {
      if (next.hash) scrollToHash(next.hash);
      else window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (isFileProtocol()) {
      const route = `${url.pathname}${url.search}`;
      if (options?.replace) {
        window.location.replace(`#${route}`);
      } else {
        window.location.hash = route;
      }
      setLocation({ pathname: next.pathname, search: next.search, hash: url.hash });
      return;
    }

    const target = `${url.pathname}${url.search}${url.hash}`;
    try {
      if (options?.replace) window.history.replaceState(null, "", target);
      else window.history.pushState(null, "", target);
    } catch {
      window.location.hash = `${url.pathname}${url.search}`;
    }

    setLocation(next);
  }, [location.pathname, location.search, location.hash]);

  return createElement(RouterContext.Provider, { value: { location, navigate } }, children);
}

export function useRouter(): RouterValue {
  const value = useContext(RouterContext);
  if (!value) throw new Error("useRouter must be used inside RouterProvider");
  return value;
}

export function useLocation(): AppLocation {
  return useRouter().location;
}

export function useNavigate(): RouterValue["navigate"] {
  return useRouter().navigate;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  replace?: boolean;
};

export function Link({ href, replace, onClick, children, ...rest }: LinkProps) {
  const navigate = useNavigate();

  const isExternal = /^(https?:|mailto:|tel:)/i.test(href);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (rest.target && rest.target !== "_self") return;
    if (isExternal) return;
    event.preventDefault();
    navigate(href, { replace });
  }

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
