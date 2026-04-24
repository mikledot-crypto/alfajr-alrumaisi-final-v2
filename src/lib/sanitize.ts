import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML coming from the rich text editor before rendering.
 * Allows common editorial tags but strips scripts, event handlers, iframes, etc.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "hr", "strong", "em", "u", "s", "code", "pre",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote",
      "a", "img",
      "span", "div",
    ],
    ALLOWED_ATTR: ["href", "title", "alt", "src", "target", "rel", "class"],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    ADD_ATTR: ["target", "rel"],
  });
}
