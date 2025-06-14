export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+|-+$/g, "") // Remove leading/trailing -
}

// Helper function to convert MangaDx title to slug
export function titleToSlug(title: string): string {
  return slugify(title)
}

// Helper function to convert slug back to search term
export function slugToSearchTerm(slug: string): string {
  return slug.replace(/-/g, ' ')
}