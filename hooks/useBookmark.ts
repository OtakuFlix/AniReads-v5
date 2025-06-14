import { useState, useEffect, useCallback } from 'react';
import { Bookmark, getBookmark, setBookmark, removeBookmark, isCurrentBookmark, getBookmarks } from '@/lib/bookmark-utils';

export const useBookmark = (itemId?: string) => {
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark | null>(null);
  const [allBookmarks, setAllBookmarks] = useState<Bookmark[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load bookmarks on mount and when itemId changes
  useEffect(() => {
    const bookmarks = getBookmarks();
    setAllBookmarks(bookmarks);
    
    if (itemId) {
      const bookmark = bookmarks.find(b => b.id === itemId) || null;
      setCurrentBookmark(bookmark);
      setIsBookmarked(!!bookmark);
    }
  }, [itemId]);

  // Update bookmark state when it changes
  const updateBookmark = useCallback(async (item: Omit<Bookmark, 'timestamp'> | null) => {
    if (!itemId) return false;
    
    setIsLoading(true);
    try {
      let success: boolean;
      
      if (item) {
        success = await setBookmark(item);
        if (success) {
          const updatedBookmarks = getBookmarks();
          const newBookmark = updatedBookmarks.find(b => b.id === item.id) || null;
          setCurrentBookmark(newBookmark);
          setAllBookmarks(updatedBookmarks);
          setIsBookmarked(true);
        }
      } else {
        success = await removeBookmark(itemId);
        if (success) {
          setCurrentBookmark(null);
          setAllBookmarks(prev => prev.filter(b => b.id !== itemId));
          setIsBookmarked(false);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error updating bookmark:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  // Toggle bookmark status
  const toggleBookmark = useCallback(async (item: Omit<Bookmark, 'timestamp'>) => {
    if (isCurrentBookmark(item.id)) {
      return updateBookmark(null);
    }
    return updateBookmark(item);
  }, [updateBookmark]);

  return {
    currentBookmark,
    allBookmarks,
    isBookmarked: itemId ? isBookmarked : false,
    isLoading,
    updateBookmark,
    toggleBookmark,
    removeBookmark: () => itemId ? updateBookmark(null) : Promise.resolve(false),
  };
};
