/**
 * API Module - Data fetching utilities
 */
const API = {
  // Cache for fetched data
  cache: new Map(),

  /**
   * Fetch JSON data with caching
   */
  async fetchJson(url) {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();

      // Cache the result
      this.cache.set(url, data);
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  /**
   * Fetch board index (thread list)
   */
  async fetchIndex(boardId) {
    const url = getIndexUrl(boardId);
    return this.fetchJson(url);
  },

  /**
   * Fetch thread detail
   */
  async fetchThread(boardId, threadId) {
    const url = getThreadUrl(boardId, threadId);
    return this.fetchJson(url);
  },

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  },
};
