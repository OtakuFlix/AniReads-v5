export interface Bookmark {
  id: string;
  title: string;
  slug: string;
  posterUrl: string;
  type: 'manga' | 'anime';
  timestamp: number;
}

export const BOOKMARK_KEY = 'anireads_bookmarks';
const MAX_BOOKMARKS = 5;

export const getBookmarks = (): Bookmark[] => {
  if (typeof window === 'undefined') return [];
  const bookmarks = localStorage.getItem(BOOKMARK_KEY);
  return bookmarks ? JSON.parse(bookmarks) : [];
};

export const getBookmark = (id: string): Bookmark | null => {
  const bookmarks = getBookmarks();
  return bookmarks.find(bookmark => bookmark.id === id) || null;
};

export const setBookmark = (item: Omit<Bookmark, 'timestamp'>): boolean => {
  try {
    const bookmarks = getBookmarks();
    const existingIndex = bookmarks.findIndex(b => b.id === item.id);
    
    const newBookmark: Bookmark = {
      ...item,
      timestamp: Date.now(),
    };

    if (existingIndex >= 0) {
      // Update existing bookmark
      bookmarks[existingIndex] = newBookmark;
    } else {
      // Add new bookmark, but limit to MAX_BOOKMARKS
      if (bookmarks.length >= MAX_BOOKMARKS) {
        // Remove the oldest bookmark (first in the array if sorted by timestamp)
        bookmarks.sort((a, b) => a.timestamp - b.timestamp);
        bookmarks.shift();
      }
      bookmarks.push(newBookmark);
    }

    // Sort by timestamp (newest first)
    bookmarks.sort((a, b) => b.timestamp - a.timestamp);
    
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
    return true;
  } catch (error) {
    console.error('Error saving bookmark:', error);
    return false;
  }
};

export const removeBookmark = (id: string): boolean => {
  try {
    const bookmarks = getBookmarks().filter(bookmark => bookmark.id !== id);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
    return true;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return false;
  }
};

export const isCurrentBookmark = (id: string): boolean => {
  const bookmarks = getBookmarks();
  return bookmarks.some(bookmark => bookmark.id === id);
};
