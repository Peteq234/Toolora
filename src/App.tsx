import { lazy, Suspense } from "react";
import { RouterProvider, useLocation } from "@/lib/router";
import { PlatformProvider } from "@/lib/platform";
import { LanguageProvider } from "@/lib/i18n";
import { FavoritesProvider } from "@/lib/favorites";
import { RecentProvider } from "@/lib/recent";
import { getTool } from "@/lib/tools";
import { Layout, SearchProvider } from "@/components/Layout";
import { Home } from "@/pages/Home";
import { FavoritesPage, ToolsIndex } from "@/pages/Browse";
import { AboutPage, ContactPage, NotFoundPage } from "@/pages/Company";
import { PrivacyPage, TermsPage } from "@/pages/Legal";
import { SuggestPage } from "@/pages/Suggest";
import { ToolPage } from "@/pages/ToolPage";
import { SuitePage } from "@/pages/SuitePage";

const AdminPage = lazy(() => import("@/pages/AdminPage"));

function AdminLoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-950">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mist-500">Loading the private console…</p>
    </div>
  );
}

function Routes() {
  const { pathname } = useLocation();

  if (pathname.startsWith("/admin")) {
    return (
      <Suspense fallback={<AdminLoadingScreen />}>
        <AdminPage />
      </Suspense>
    );
  }

  if (pathname === "/" || pathname === "/index.html") return <Home />;
  if (pathname === "/tools") return <ToolsIndex />;
  if (pathname === "/favorites") return <FavoritesPage />;
  if (pathname === "/about") return <AboutPage />;
  if (pathname === "/contact") return <ContactPage />;
  if (pathname === "/suggest") return <SuggestPage />;
  if (pathname === "/privacy") return <PrivacyPage />;
  if (pathname === "/terms") return <TermsPage />;

  if (pathname.startsWith("/toolkits/")) {
    const slug = decodeURIComponent(pathname.slice("/toolkits/".length));
    return <SuitePage suiteSlug={slug} />;
  }

  if (pathname.startsWith("/tools/")) {
    const slug = decodeURIComponent(pathname.slice("/tools/".length));
    const tool = getTool(slug);
    if (tool) return <ToolPage tool={tool} />;
  }

  return <NotFoundPage />;
}

function RoutedContent() {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="route-transition">
      <Routes />
    </div>
  );
}

function Shell() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return <Routes />;
  return (
    <FavoritesProvider>
      <RecentProvider>
        <SearchProvider>
          <Layout>
            <RoutedContent />
          </Layout>
        </SearchProvider>
      </RecentProvider>
    </FavoritesProvider>
  );
}

export default function App() {
  return (
    <PlatformProvider>
      <LanguageProvider>
      <RouterProvider>
        <Shell />
      </RouterProvider>
      </LanguageProvider>
    </PlatformProvider>
  );
}
