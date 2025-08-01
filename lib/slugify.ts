export function slugify(text: string): string {
  return encodeURIComponent(text.toLowerCase().trim().replace(/\s+/g, "-"));
}
