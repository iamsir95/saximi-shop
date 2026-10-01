type MetaAttribute = "name" | "property";

export function stripSeoText(value = "") {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function truncateSeoText(value: string, max = 158) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const sliced = clean.slice(0, max - 1);
  return `${sliced.slice(0, Math.max(0, sliced.lastIndexOf(" "))).trim()}…`;
}

export function absoluteSeoUrl(value: string | undefined, origin: string) {
  try {
    return new URL(value || "/icon.png", origin).href;
  } catch {
    return value || "/icon.png";
  }
}

function upsertMeta(attr: MetaAttribute, key: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.content = content;
  meta.dataset.postSeo = "true";
  return meta;
}

export function applySeoTags(input: {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  type?: "website" | "article" | "product";
  robots?: string;
  structuredData?: unknown;
}) {
  document.querySelectorAll("[data-post-seo]").forEach((el) => el.remove());
  document.title = input.title;

  const tags: HTMLElement[] = [];
  tags.push(upsertMeta("name", "description", input.description));
  tags.push(upsertMeta("property", "og:site_name", "Saximi Shop"));
  tags.push(upsertMeta("property", "og:title", input.title));
  tags.push(upsertMeta("property", "og:description", input.description));
  tags.push(upsertMeta("property", "og:url", input.canonical));
  tags.push(upsertMeta("property", "og:type", input.type || "website"));
  tags.push(upsertMeta("name", "twitter:card", "summary_large_image"));
  tags.push(upsertMeta("name", "twitter:title", input.title));
  tags.push(upsertMeta("name", "twitter:description", input.description));

  if (input.image) {
    tags.push(upsertMeta("property", "og:image", input.image));
    tags.push(upsertMeta("property", "og:image:secure_url", input.image));
    tags.push(upsertMeta("property", "og:image:alt", input.title));
    tags.push(upsertMeta("name", "twitter:image", input.image));
  }

  if (input.robots) {
    tags.push(upsertMeta("name", "robots", input.robots));
  }

  const canonical = document.createElement("link");
  canonical.rel = "canonical";
  canonical.href = input.canonical;
  canonical.dataset.postSeo = "true";
  document.head.appendChild(canonical);
  tags.push(canonical);

  if (input.structuredData) {
    const structured = document.createElement("script");
    structured.type = "application/ld+json";
    structured.dataset.postSeo = "true";
    structured.textContent = JSON.stringify(input.structuredData);
    document.head.appendChild(structured);
    tags.push(structured);
  }

  return () => {
    tags.forEach((el) => el.remove());
  };
}
