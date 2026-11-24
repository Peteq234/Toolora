import { useEffect } from "react";

export const SITE_URL = "https://toolora.com";
export const SITE_NAME = "Toolora";

type SeoOptions = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  schema?: Record<string, unknown> | Record<string, unknown>[];
  type?: "website" | "article";
};

function ensureMeta(attr: "name" | "property", key: string): HTMLMetaElement {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  return element;
}

function ensureLink(rel: string): HTMLLinkElement {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  return element;
}

export function useSeo({ title, description, path, noindex, schema, type = "website" }: SeoOptions) {
  const schemaKey = schema ? JSON.stringify(schema) : "";

  useEffect(() => {
    document.title = title;
    ensureMeta("name", "description").setAttribute("content", description);
    ensureMeta("name", "robots").setAttribute(
      "content",
      noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"
    );
    ensureMeta("property", "og:title").setAttribute("content", title);
    ensureMeta("property", "og:description").setAttribute("content", description);
    ensureMeta("property", "og:type").setAttribute("content", type);
    ensureMeta("property", "og:url").setAttribute("content", `${SITE_URL}${path}`);
    ensureMeta("property", "og:site_name").setAttribute("content", SITE_NAME);
    ensureMeta("name", "twitter:card").setAttribute("content", "summary_large_image");
    ensureMeta("name", "twitter:title").setAttribute("content", title);
    ensureMeta("name", "twitter:description").setAttribute("content", description);
    ensureMeta("property", "og:image").setAttribute("content", `${SITE_URL}/og-image.png`);
    ensureMeta("property", "og:image:width").setAttribute("content", "1200");
    ensureMeta("property", "og:image:height").setAttribute("content", "630");
    ensureMeta("property", "og:image:alt").setAttribute(
      "content",
      "Toolora — free online tools, no account required"
    );
    ensureMeta("name", "twitter:image").setAttribute("content", `${SITE_URL}/og-image.png`);
    ensureLink("canonical").setAttribute("href", `${SITE_URL}${path}`);

    const scriptId = "toolora-page-schema";
    document.getElementById(scriptId)?.remove();
    if (schemaKey) {
      const parsed = JSON.parse(schemaKey);
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = scriptId;
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": Array.isArray(parsed) ? parsed : [parsed],
      });
      document.head.appendChild(script);
    }
  }, [title, description, path, noindex, schemaKey, type]);
}
