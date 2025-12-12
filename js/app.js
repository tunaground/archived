/**
 * Main Application
 */
const App = {
  /**
   * Initialize the application
   */
  init() {
    // Initialize theme
    Theme.init();

    // Setup event listeners
    this.setupEventListeners();

    // Register routes
    this.registerRoutes();

    // Initialize router
    Router.init();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      Theme.toggle();
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });

    // Close sidebar on navigation (mobile)
    window.addEventListener('hashchange', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  },

  /**
   * Register application routes
   */
  registerRoutes() {
    // Board index (thread list)
    Router.register('/:boardId', async (params, query) => {
      await this.handleBoardIndex(params.boardId, query.page);
    });

    // Thread detail
    Router.register('/:boardId/:threadId', async (params) => {
      await this.handleThreadDetail(params.boardId, params.threadId, null);
    });

    // Thread detail with single response highlight
    Router.register('/:boardId/:threadId/:seq', async (params) => {
      await this.handleThreadDetail(params.boardId, params.threadId, params.seq);
    });
  },

  /**
   * Handle board index route
   */
  async handleBoardIndex(boardId, pageParam) {
    Render.showLoading();

    try {
      const threads = await API.fetchIndex(boardId);

      // Sort by updatedAt descending (most recent first)
      threads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      // Pagination
      const page = parseInt(pageParam, 10) || 1;
      const totalPages = Math.ceil(threads.length / CONFIG.threadsPerPage);
      const startIndex = (page - 1) * CONFIG.threadsPerPage;
      const pageThreads = threads.slice(startIndex, startIndex + CONFIG.threadsPerPage);

      Render.renderThreadList(boardId, pageThreads, page, totalPages);
    } catch (error) {
      Render.showError(`Failed to load threads: ${error.message}`);
    }
  },

  /**
   * Handle thread detail route
   */
  async handleThreadDetail(boardId, threadId, seqParam) {
    Render.showLoading();

    try {
      const thread = await API.fetchThread(boardId, threadId);

      // Parse sequence parameter for highlighting
      const highlightSeqs = this.parseSeqParam(seqParam);

      Render.renderThreadDetail(boardId, thread, highlightSeqs);
    } catch (error) {
      Render.showError(`Failed to load thread: ${error.message}`);
    }
  },

  /**
   * Parse sequence parameter
   * Supports: "5" (single), "5-10" (range)
   */
  parseSeqParam(seqParam) {
    if (!seqParam) return [];

    const seqs = [];

    // Check for range (e.g., "5-10")
    if (seqParam.includes('-')) {
      const [start, end] = seqParam.split('-').map(s => parseInt(s, 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          seqs.push(i);
        }
      }
    } else {
      // Single sequence
      const seq = parseInt(seqParam, 10);
      if (!isNaN(seq)) {
        seqs.push(seq);
      }
    }

    return seqs;
  },
};

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
