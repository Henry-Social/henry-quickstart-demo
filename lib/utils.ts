export function getValidImageUrl(url: string | undefined | null): string {
  // Placeholder image URL (transparent 1x1 pixel)
  const placeholderImage =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  if (!url || url.trim() === "") {
    return placeholderImage;
  }

  // Check if it's already a valid URL
  try {
    new URL(url);
    return url;
  } catch {
    // If it's a relative path starting with /, try to make it absolute
    if (url.startsWith("/")) {
      return `https://example.com${url}`;
    }
    // If it's a data URL, return as is
    if (url.startsWith("data:")) {
      return url;
    }
    // Otherwise return placeholder
    return placeholderImage;
  }
}
