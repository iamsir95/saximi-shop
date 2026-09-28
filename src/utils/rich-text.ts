const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;
const BLOCKED_TAGS = ["script", "style", "iframe", "object", "embed", "meta", "link"];

export function hasHtmlContent(value?: string) {
  return Boolean(value && HTML_PATTERN.test(value));
}

export function sanitizeRichText(value?: string) {
  if (!value) return "";
  if (!hasHtmlContent(value)) return value;

  const template = document.createElement("template");
  template.innerHTML = value;

  template.content.querySelectorAll(BLOCKED_TAGS.join(",")).forEach((node) => {
    node.remove();
  });

  template.content.querySelectorAll<HTMLElement>("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const rawValue = attr.value.trim().toLowerCase();

      if (name.startsWith("on")) {
        node.removeAttribute(attr.name);
        return;
      }

      if (["href", "src"].includes(name) && rawValue.startsWith("javascript:")) {
        node.removeAttribute(attr.name);
      }
    });
  });

  return template.innerHTML;
}
