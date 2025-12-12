/**
 * Render Module - DOM rendering utilities
 */
const Render = {
  /**
   * Get app container
   */
  getContainer() {
    return document.getElementById('app');
  },

  /**
   * Set page title
   */
  setTitle(title) {
    document.title = title ? `${title} - Archive` : 'Archive - Tunaground';
    document.getElementById('page-title').textContent = title || 'Archive';
  },

  /**
   * Show loading state
   */
  showLoading() {
    this.getContainer().innerHTML = '<div class="loading">Loading...</div>';
  },

  /**
   * Show error state
   */
  showError(message) {
    this.getContainer().innerHTML = `<div class="error">${this.escapeHtml(message)}</div>`;
  },

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Process content: convert URLs and anchors to clickable links
   * Processes text nodes only, preserving existing HTML
   */
  processContent(html, boardId, threadId) {
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = html;

    // Walk through all text nodes
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // Combined regex for URLs and anchors
    // Anchor patterns:
    //   >>5, >>5-10 (current thread)
    //   >1234>5, >1234>5-10, >1234> (current board, other thread)
    //   tuna>1234>5, tuna>1234>5-10, tuna>1234> (other board)
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/;
    const anchorRegex = /([a-z]*)>(\d*)>(\d*)(?:-(\d+))?/;
    const combinedRegex = new RegExp(`${urlRegex.source}|${anchorRegex.source}`, 'g');

    textNodes.forEach(textNode => {
      const text = textNode.nodeValue;
      if (!combinedRegex.test(text)) return;

      // Reset regex
      combinedRegex.lastIndex = 0;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      while ((match = combinedRegex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }

        const fullMatch = match[0];

        if (match[1]) {
          // URL match
          const link = document.createElement('a');
          link.href = fullMatch;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = fullMatch;
          fragment.appendChild(link);
        } else {
          // Anchor match: [0]=full, [2]=board, [3]=thread, [4]=start, [5]=end
          const anchorBoard = match[2] || boardId;
          const anchorThread = match[3] || threadId;
          const anchorStart = match[4];
          const anchorEnd = match[5];

          // Build href
          let href;
          if (!anchorStart) {
            // Thread view (e.g., >1234> or tuna>1234>)
            href = `#/${anchorBoard}/${anchorThread}`;
          } else if (anchorEnd) {
            // Range (e.g., >>5-10)
            href = `#/${anchorBoard}/${anchorThread}/${anchorStart}-${anchorEnd}`;
          } else {
            // Single response (e.g., >>5)
            href = `#/${anchorBoard}/${anchorThread}/${anchorStart}`;
          }

          const link = document.createElement('a');
          link.href = href;
          link.className = 'anchor-link';
          link.textContent = fullMatch;
          fragment.appendChild(link);
        }

        lastIndex = combinedRegex.lastIndex;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      textNode.parentNode.replaceChild(fragment, textNode);
    });

    return container.innerHTML;
  },

  /**
   * Extract YouTube video ID from URL or return as-is if already an ID
   */
  extractYoutubeId(input) {
    if (!input) return null;

    // Already a video ID (11 characters, alphanumeric with - and _)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return input;
    }

    // Try to extract from various URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }

    return null;
  },

  /**
   * Format date string
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  /**
   * Render board sidebar
   */
  renderSidebar(activeBoardId) {
    const boardList = document.getElementById('board-list');
    boardList.innerHTML = CONFIG.boards.map(board => `
      <li>
        <a href="#/${board.id}"
           class="sidebar-item ${board.id === activeBoardId ? 'active' : ''}">
          ${this.escapeHtml(board.name)}
        </a>
      </li>
    `).join('');
  },

  /**
   * Render search box
   */
  renderSearchBox(boardId, query = '') {
    return `
      <div class="search-box">
        <input type="text"
               id="search-input"
               class="search-input"
               placeholder="검색어 입력..."
               value="${this.escapeHtml(query)}"
               autocomplete="off">
        <button type="button" id="search-btn" class="search-btn" aria-label="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
    `;
  },

  /**
   * Render thread list (index page)
   */
  renderThreadList(boardId, threads, page, totalPages, query = '', allThreads = null) {
    const board = CONFIG.boards.find(b => b.id === boardId);
    const boardName = board ? board.name : boardId;

    this.setTitle(boardName);
    this.renderSidebar(boardId);

    const html = `
      <div class="page-header">
        <h1 class="page-title">${this.escapeHtml(boardName)} Archive</h1>
        <p class="page-description">Archived threads from ${this.escapeHtml(boardName)} board</p>
      </div>

      ${this.renderSearchBox(boardId, query)}

      <div id="thread-results">
        ${this.renderThreadResults(boardId, threads, page, totalPages, query)}
      </div>
    `;

    this.getContainer().innerHTML = html;

    // Setup search event listeners (allThreads for live filtering)
    this.setupSearchListeners(boardId, allThreads || threads);
  },

  /**
   * Render thread results (list + pagination)
   */
  renderThreadResults(boardId, threads, page, totalPages, query = '') {
    if (threads.length === 0) {
      return `<div class="empty">${query ? '검색 결과가 없습니다.' : 'No threads found.'}</div>`;
    }
    return `
      <div class="thread-list">
        ${threads.map(thread => this.renderThreadCard(boardId, thread, query)).join('')}
      </div>
      ${this.renderPagination(boardId, page, totalPages, query)}
    `;
  },

  /**
   * Setup search event listeners
   */
  setupSearchListeners(boardId, allThreads) {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-btn');

    if (!input || !btn) return;

    let debounceTimer = null;

    const updateUrl = (query) => {
      const newHash = query
        ? `#/${boardId}?q=${encodeURIComponent(query)}`
        : `#/${boardId}`;
      // URL만 변경하고 hashchange 이벤트 발생시키지 않음
      history.replaceState(null, '', newHash);
    };

    const doSearch = () => {
      const query = input.value.trim();
      updateUrl(query);
      App.renderFilteredThreads(boardId, allThreads, query);
    };

    // 실시간 검색 (debounce 150ms)
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(doSearch, 150);
    });

    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(debounceTimer);
        doSearch();
      }
    });
  },

  /**
   * Highlight search query in text
   */
  highlightQuery(text, query) {
    if (!query) return this.escapeHtml(text);
    const escaped = this.escapeHtml(text);
    const queryEscaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${queryEscaped})`, 'gi');
    return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
  },

  /**
   * Render a single thread card
   */
  renderThreadCard(boardId, thread, query = '') {
    return `
      <article class="thread-card">
        <h2 class="thread-card-title">
          <span class="thread-id">#${thread.threadId}</span>
          <a href="#/${boardId}/${thread.threadId}">
            ${this.highlightQuery(thread.title, query)}
          </a>
          <span class="thread-size">(${thread.size})</span>
        </h2>
        <div class="thread-card-meta">
          <span>${this.highlightQuery(thread.username, query)}</span>
        </div>
        <div class="thread-card-meta">
          <span>${this.formatDate(thread.createdAt)} - ${this.formatDate(thread.updatedAt)}</span>
        </div>
      </article>
    `;
  },

  /**
   * Render pagination
   */
  renderPagination(boardId, currentPage, totalPages, query = '') {
    if (totalPages <= 1) return '';

    const pages = [];
    const maxVisible = 5;

    // Always show first page
    pages.push(1);

    // Calculate range around current page
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    // Adjust range if near edges
    if (currentPage <= 3) {
      end = Math.min(totalPages - 1, maxVisible - 1);
    } else if (currentPage >= totalPages - 2) {
      start = Math.max(2, totalPages - maxVisible + 2);
    }

    // Add ellipsis before range if needed
    if (start > 2) {
      pages.push('...');
    }

    // Add range
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis after range if needed
    if (end < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    // Build query string for pagination links
    const queryParams = query ? `&q=${encodeURIComponent(query)}` : '';

    return `
      <nav class="pagination" aria-label="Pagination">
        ${pages.map(p => {
          if (p === '...') {
            return '<span class="pagination-ellipsis">...</span>';
          }
          if (p === currentPage) {
            return `<span class="pagination-current">${p}</span>`;
          }
          return `<a href="#/${boardId}?page=${p}${queryParams}" class="pagination-link">${p}</a>`;
        }).join('')}
      </nav>
    `;
  },

  /**
   * Render thread detail page
   */
  renderThreadDetail(boardId, thread, highlightSeqs) {
    this.setTitle(thread.title);
    this.renderSidebar(boardId);

    const html = `
      <a href="#/${boardId}" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to list
      </a>

      <header class="thread-header">
        <h1 class="thread-title">${this.escapeHtml(thread.title)}</h1>
        <div class="thread-meta">
          <div class="thread-meta-item">
            <span class="thread-meta-label">Author:</span>
            <span class="thread-meta-value">${this.escapeHtml(thread.username)}</span>
          </div>
          <div class="thread-meta-item">
            <span class="thread-meta-label">Responses:</span>
            <span class="thread-meta-value">${thread.size}</span>
          </div>
          <div class="thread-meta-item">
            <span class="thread-meta-label">Created:</span>
            <span class="thread-meta-value">${this.formatDate(thread.createdAt)}</span>
          </div>
          <div class="thread-meta-item">
            <span class="thread-meta-label">Updated:</span>
            <span class="thread-meta-value">${this.formatDate(thread.updatedAt)}</span>
          </div>
        </div>
      </header>

      <div class="response-list">
        ${thread.responses.map(response =>
          this.renderResponse(boardId, thread.threadId, response, highlightSeqs.includes(response.sequence))
        ).join('')}
      </div>
    `;

    this.getContainer().innerHTML = html;

    // Scroll to first highlighted response
    if (highlightSeqs.length > 0) {
      const firstHighlighted = document.getElementById(`response-${highlightSeqs[0]}`);
      if (firstHighlighted) {
        setTimeout(() => {
          firstHighlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  },

  /**
   * Render a single response
   */
  renderResponse(boardId, threadId, response, highlighted) {
    const hasAttachment = response.attachment && response.attachment.length > 0;
    const youtubeId = this.extractYoutubeId(response.youtube);
    const hasYoutube = !!youtubeId;
    const attachmentUrl = hasAttachment ? getAttachmentUrl(boardId, response.attachment) : null;
    const isImage = hasAttachment && /\.(jpg|jpeg|png|gif|webp)$/i.test(response.attachment);

    return `
      <article class="response-card ${highlighted ? 'highlighted' : ''}" id="response-${response.sequence}">
        <header class="response-header">
          <span class="response-seq">
            <a href="#/${boardId}/${threadId}/${response.sequence}">#${response.sequence}</a>
          </span>
          <span class="response-username">${response.username}</span>
          <span class="response-author-id">(${this.escapeHtml(response.userId)})</span>
          <span class="response-date">${this.formatDate(response.createdAt)}</span>
        </header>
        ${hasAttachment ? `
          <div class="response-attachment">
            ${isImage ? `
              <a href="${attachmentUrl}" target="_blank">
                <img src="${attachmentUrl}" alt="Attachment" class="attachment-image" loading="lazy">
              </a>
            ` : `
              <a href="${attachmentUrl}" target="_blank" class="attachment-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                </svg>
                ${this.escapeHtml(response.attachment)}
              </a>
            `}
          </div>
        ` : ''}
        ${hasYoutube ? `
          <div class="response-attachment">
            <div class="youtube-embed">
              <iframe
                src="https://www.youtube.com/embed/${youtubeId}"
                allowfullscreen
                loading="lazy">
              </iframe>
            </div>
          </div>
        ` : ''}
        <div class="response-content">
          ${this.processContent(response.content, boardId, threadId)}
        </div>
      </article>
    `;
  },
};
