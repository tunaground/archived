/**
 * Archive Configuration
 */
const CONFIG = {
  // Data source URL
  dataBaseUrl: 'https://archive-data.tunaground.net/data',

  // Available boards
  boards: [
    { id: 'tuna', name: 'Tuna' },
    { id: 'situplay', name: 'Situplay' },
    { id: 'anchor', name: 'Anchor' },
  ],

  // Pagination
  threadsPerPage: 20,

  // Default board
  defaultBoard: 'tuna',
};

/**
 * Get data URL for a board's index
 */
function getIndexUrl(boardId) {
  return `${CONFIG.dataBaseUrl}/${boardId}/index.json`;
}

/**
 * Get data URL for a thread
 */
function getThreadUrl(boardId, threadId) {
  return `${CONFIG.dataBaseUrl}/${boardId}/${threadId}.json`;
}

/**
 * Get attachment URL
 */
function getAttachmentUrl(boardId, filename) {
  return `${CONFIG.dataBaseUrl}/${boardId}/attachment/${encodeURIComponent(filename)}`;
}
