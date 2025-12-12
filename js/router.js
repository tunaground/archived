/**
 * Hash-based Router
 */
const Router = {
  routes: [],
  currentRoute: null,

  /**
   * Register a route
   * @param {string} pattern - Route pattern (e.g., '/:boardId', '/:boardId/:threadId')
   * @param {Function} handler - Route handler function
   */
  register(pattern, handler) {
    // Convert pattern to regex
    const regex = new RegExp(
      '^' + pattern
        .replace(/:[^/]+/g, '([^/]+)')
        .replace(/\//g, '\\/') + '$'
    );

    // Extract param names
    const paramNames = (pattern.match(/:[^/]+/g) || []).map(p => p.slice(1));

    this.routes.push({ pattern, regex, paramNames, handler });
  },

  /**
   * Parse current hash and return route info
   */
  parseHash() {
    const hash = window.location.hash.slice(1) || '/';

    // Handle query string in hash
    const [path, queryString] = hash.split('?');
    const query = {};
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        query[decodeURIComponent(key)] = decodeURIComponent(value || '');
      });
    }

    return { path, query };
  },

  /**
   * Match path against registered routes
   */
  match(path) {
    for (const route of this.routes) {
      const match = path.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]);
        });
        return { route, params };
      }
    }
    return null;
  },

  /**
   * Navigate to a path
   */
  navigate(path) {
    window.location.hash = path;
  },

  /**
   * Handle route change
   */
  async handleRoute() {
    const { path, query } = this.parseHash();
    const matched = this.match(path);

    if (matched) {
      this.currentRoute = { path, query, params: matched.params };
      await matched.route.handler(matched.params, query);
    } else {
      // Default to board list or 404
      console.warn('No route matched:', path);
      this.navigate(`/${CONFIG.defaultBoard}`);
    }
  },

  /**
   * Initialize router
   */
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());

    // Handle initial route
    if (!window.location.hash) {
      this.navigate(`/${CONFIG.defaultBoard}`);
    } else {
      this.handleRoute();
    }
  },
};
