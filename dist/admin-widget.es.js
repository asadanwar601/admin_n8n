


const DEFAULT_CATEGORIES = [
  'Return & Exchange Policy',
  'Shipping & Delivery Policy',
  'Garment Care & Fabric Guide',
  'Sizing & Fit Guide',
  'Internal Admin SOP',
];

class AdminRagWidget {
          config           
         
                     
                                                                                        
     
   ;
          target                       ;
          adminUsername = '';
          adminPassword = '';
          onIngestSuccess                                                      ;
          onIngestError                         ;

          container              ;
          windowEl              ;
          bubbleBtn                    ;
          activeTab                 = 'file';
          selectedFile              = null;
          isSubmitting = false;
          isOpen = false;
          showCredsForm = false;
          historyKey        ;
          history                     = [];
          totalChunksCount                = null;

  constructor(options                ) {
    if (!options.apiUrl) {
      throw new Error('[admin_n8n] "apiUrl" is required to initialize Admin RAG widget.');
    }

    const botId = options.botId || 'default_bot';
    const inferredMode = options.mode || 'inline';
    this.target = options.target;
    this.onIngestSuccess = options.onIngestSuccess;
    this.onIngestError = options.onIngestError;
    this.historyKey = `n8n_admin_rag_history_${botId}`;

    this.config = {
      apiUrl: options.apiUrl.replace(/\/+$/, ''),
      mode: inferredMode,
      botId,
      title: options.title || 'Knowledge Base & Hybrid RAG Admin',
      subtitle:
        options.subtitle ||
        'Upload documents or scrape URLs into PGVector + Full-Text Search (chat_rag)',
      primaryColor: options.primaryColor || '#201c18',
      position: options.position || 'bottom-right',
      credentialsStorageKey: options.credentialsStorageKey || `n8n_admin_cred_${botId}`,
      defaultCategories: options.defaultCategories || DEFAULT_CATEGORIES,
      acceptFileTypes: options.acceptFileTypes || '.pdf,.doc,.docx,.csv,.xlsx,.txt,.md',
      footerText: options.footerText || 'Secured by Admin Cred · Hybrid PGVector + FTS Pipeline',
    };

    this.loadCredentials(options.adminUsername, options.adminPassword);
    this.loadHistory();
    this.initDOM();
    this.setupPostMessageSSO();
  }

         setCredentials(username        , password        , persistInSession = true)       {
    this.adminUsername = username.trim();
    this.adminPassword = password;
    this.showCredsForm = !(this.adminUsername && this.adminPassword);

    if (persistInSession && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          this.config.credentialsStorageKey,
          JSON.stringify({ u: this.adminUsername, p: this.adminPassword })
        );
      } catch {
        // Ignore storage errors
      }
    }
    this.renderCredsState();
  }

         clearCredentials()       {
    this.adminUsername = '';
    this.adminPassword = '';
    this.showCredsForm = true;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(this.config.credentialsStorageKey);
      } catch {
        // Ignore storage errors
      }
    }
    this.renderCredsState();
  }

          loadCredentials(initUser         , initPass         )       {
    if (initUser && initPass) {
      this.adminUsername = initUser.trim();
      this.adminPassword = initPass;
      this.showCredsForm = false;
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(this.config.credentialsStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.u && parsed?.p) {
            this.adminUsername = String(parsed.u);
            this.adminPassword = String(parsed.p);
            this.showCredsForm = false;
            return;
          }
        }
      } catch {
        // Ignore storage errors
      }
    }

    this.showCredsForm = true;
  }

          setupPostMessageSSO()       {
    if (typeof window === 'undefined') return;
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (data && data.type === 'N8N_ADMIN_CRED' && data.username && data.password) {
        this.setCredentials(String(data.username), String(data.password), true);
      }
    });
  }

          getBasicAuthHeader()         {
    const token = btoa(
      unescape(encodeURIComponent(`${this.adminUsername}:${this.adminPassword}`))
    );
    return `Basic ${token}`;
  }

          loadHistory()       {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.historyKey);
      if (raw) {
        this.history = JSON.parse(raw);
        const latestWithChunks = this.history.find(
          (h) => typeof h.totalChunks === 'number'
        );
        if (latestWithChunks?.totalChunks !== undefined) {
          this.totalChunksCount = latestWithChunks.totalChunks;
        }
      }
    } catch {
      this.history = [];
    }
  }

          saveHistory()       {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.historyKey, JSON.stringify(this.history.slice(0, 25)));
    } catch {
      // Ignore storage quota errors
    }
  }

          initDOM()       {
    if (typeof document === 'undefined') return;

    document.documentElement.style.setProperty(
      '--n8n-admin-primary',
      this.config.primaryColor
    );

    this.container = document.createElement('div');
    const isFloating = this.config.mode === 'floating';
    this.container.className = isFloating
      ? `n8n-admin-root n8n-admin-floating position-${this.config.position}`
      : 'n8n-admin-root n8n-admin-inline';

    const categoryButtonsHtml = this.config.defaultCategories
      .map(
        (cat) =>
          `<button type="button" class="n8n-admin-chip" data-category="${this.escapeHTML(cat)}">${this.escapeHTML(cat)}</button>`
      )
      .join('');

    this.container.innerHTML = `
      <div class="n8n-admin-panel ${isFloating ? 'n8n-hidden' : ''}">
        <!-- Header -->
        <div class="n8n-admin-header">
          <div class="n8n-admin-header-info">
            <div class="n8n-admin-header-title">
              <span class="n8n-admin-status-dot"></span>
              <span>${this.escapeHTML(this.config.title)}</span>
              <span class="n8n-admin-chunk-pill" id="n8n-admin-chunk-pill" style="${
                this.totalChunksCount !== null ? '' : 'display:none;'
              }">
                ${this.totalChunksCount !== null ? `${this.totalChunksCount} chunks in chat_rag` : ''}
              </span>
            </div>
            <div class="n8n-admin-header-subtitle">${this.escapeHTML(this.config.subtitle)}</div>
          </div>
          ${
            isFloating
              ? `<button type="button" class="n8n-admin-close-btn" aria-label="Close Admin Panel">
                  <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>`
              : ''
          }
        </div>

        <!-- Admin Cred Bar -->
        <div class="n8n-admin-cred-section" id="n8n-admin-cred-section"></div>

        <!-- Mode Tabs (Upload Document vs Website URL) -->
        <div class="n8n-admin-tabs" role="tablist">
          <button type="button" class="n8n-admin-tab is-active" data-tab="file" role="tab">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11 8 15.01z"/></svg>
            <span>Upload Document</span>
          </button>
          <button type="button" class="n8n-admin-tab" data-tab="url" role="tab">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
            <span>Add Website URL</span>
          </button>
        </div>

        <!-- Ingestion Form Body -->
        <form class="n8n-admin-body" id="n8n-admin-ingest-form">
          <!-- File Dropzone Pane -->
          <div class="n8n-admin-pane" id="n8n-admin-pane-file">
            <label class="n8n-admin-label">Knowledge Base File (${this.escapeHTML(
              this.config.acceptFileTypes
            )})</label>
            <div class="n8n-admin-dropzone" id="n8n-admin-dropzone">
              <input
                type="file"
                id="n8n-admin-file-input"
                class="n8n-admin-file-input"
                accept="${this.escapeHTML(this.config.acceptFileTypes)}"
              />
              <div class="n8n-admin-dropzone-content" id="n8n-admin-dropzone-prompt">
                <svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                <div class="n8n-admin-dropzone-title">Drag &amp; drop a document here, or <span>browse</span></div>
                <div class="n8n-admin-dropzone-hint">Supports PDF, Word (.doc/.docx), CSV, Excel (.xlsx), TXT, Markdown</div>
              </div>
              <div class="n8n-admin-selected-file n8n-hidden" id="n8n-admin-selected-file"></div>
            </div>
          </div>

          <!-- Website URL Pane -->
          <div class="n8n-admin-pane n8n-hidden" id="n8n-admin-pane-url">
            <label class="n8n-admin-label" for="n8n-admin-url-input">Website or Policy Page URL</label>
            <input
              type="url"
              id="n8n-admin-url-input"
              class="n8n-admin-input"
              placeholder="https://velour.com/policies/returns-and-exchanges"
            />
            <div class="n8n-admin-field-hint">
              Fetches the live webpage, strips scripts/styles, prepends context headers, and indexes chunks into <code>chat_rag</code>.
            </div>
          </div>

          <!-- Shared Contextual Metadata Fields -->
          <div class="n8n-admin-grid-2">
            <div class="n8n-admin-field">
              <label class="n8n-admin-label" for="n8n-admin-category-input">Document Category / Context Header</label>
              <input
                type="text"
                id="n8n-admin-category-input"
                class="n8n-admin-input"
                placeholder="e.g. Return & Exchange Policy"
                value="${this.escapeHTML(this.config.defaultCategories[0] || 'General Knowledge Base')}"
                required
              />
              <div class="n8n-admin-chips">${categoryButtonsHtml}</div>
            </div>

            <div class="n8n-admin-field">
              <label class="n8n-admin-label" for="n8n-admin-visibility-select">Role Visibility Scope</label>
              <select id="n8n-admin-visibility-select" class="n8n-admin-select">
                <option value="public">public — Guests, Customers &amp; Admins</option>
                <option value="customer">customer — Logged-in Customers &amp; Admins</option>
                <option value="admin">admin — Store Administrators Only (Internal SOP)</option>
              </select>
              <div class="n8n-admin-field-hint">
                Enforced automatically by PostgreSQL Hybrid Search (PGVector + BM25 FTS).
              </div>
            </div>
          </div>

          <!-- Status Alert -->
          <div class="n8n-admin-status n8n-hidden" id="n8n-admin-status"></div>

          <!-- Submit Button -->
          <button type="submit" class="n8n-admin-submit-btn" id="n8n-admin-submit-btn">
            <span id="n8n-admin-submit-label">Upload &amp; Index into Knowledge Base</span>
          </button>
        </form>

        <!-- Recent Ingestion Activity Log -->
        <div class="n8n-admin-history-section">
          <div class="n8n-admin-history-header">
            <span>Recent Knowledge Base Ingestions</span>
            <button type="button" class="n8n-admin-link-btn" id="n8n-admin-clear-history">Clear log</button>
          </div>
          <div class="n8n-admin-history-list" id="n8n-admin-history-list"></div>
        </div>

        ${
          this.config.footerText
            ? `<div class="n8n-admin-footer">${this.escapeHTML(this.config.footerText)}</div>`
            : ''
        }
      </div>

      ${
        isFloating
          ? `<button type="button" class="n8n-admin-bubble" aria-label="Open Knowledge Base Admin">
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V13H5V6.3l7-2.61v9.3z"/></svg>
            </button>`
          : ''
      }
    `;

    // Mount into target container or document.body
    let mountNode                     = null;
    if (typeof this.target === 'string') {
      mountNode = document.querySelector             (this.target);
    } else if (this.target instanceof HTMLElement) {
      mountNode = this.target;
    }

    if (mountNode) {
      mountNode.innerHTML = '';
      mountNode.appendChild(this.container);
    } else {
      document.body.appendChild(this.container);
    }

    this.windowEl = this.container.querySelector('.n8n-admin-panel') ;
    this.bubbleBtn = this.container.querySelector('.n8n-admin-bubble') || undefined;

    this.bindEvents();
    this.renderCredsState();
    this.renderHistory();
  }

          renderCredsState()       {
    const credSection = this.container.querySelector             ('#n8n-admin-cred-section');
    if (!credSection) return;

    const hasCreds = Boolean(this.adminUsername && this.adminPassword);

    if (hasCreds && !this.showCredsForm) {
      credSection.innerHTML = `
        <div class="n8n-admin-cred-verified">
          <div class="n8n-admin-cred-badge">
            <svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
            <span>Authenticated via <strong>Admin Cred</strong> (${this.escapeHTML(this.adminUsername)})</span>
          </div>
          <button type="button" class="n8n-admin-link-btn" id="n8n-admin-change-cred-btn">Change Admin Cred</button>
        </div>
      `;
      const changeBtn = credSection.querySelector('#n8n-admin-change-cred-btn');
      changeBtn?.addEventListener('click', () => {
        this.showCredsForm = true;
        this.renderCredsState();
      });
      return;
    }

    credSection.innerHTML = `
      <div class="n8n-admin-cred-form">
        <div class="n8n-admin-cred-title">
          <svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
          <span>n8n <strong>Admin Cred</strong> Authentication (Required for Uploads &amp; URLs)</span>
        </div>
        <div class="n8n-admin-cred-inputs">
          <input
            type="text"
            id="n8n-admin-user-input"
            class="n8n-admin-input"
            placeholder="Admin Cred Username"
            value="${this.escapeHTML(this.adminUsername)}"
            autocomplete="username"
          />
          <input
            type="password"
            id="n8n-admin-pass-input"
            class="n8n-admin-input"
            placeholder="Admin Cred Password"
            value="${this.escapeHTML(this.adminPassword)}"
            autocomplete="current-password"
          />
          <button type="button" class="n8n-admin-cred-save-btn" id="n8n-admin-save-cred-btn">
            Unlock
          </button>
        </div>
      </div>
    `;

    const saveBtn = credSection.querySelector('#n8n-admin-save-cred-btn');
    const userInput = credSection.querySelector                  ('#n8n-admin-user-input');
    const passInput = credSection.querySelector                  ('#n8n-admin-pass-input');

    saveBtn?.addEventListener('click', () => {
      const u = userInput?.value.trim() || '';
      const p = passInput?.value || '';
      if (!u || !p) {
        this.showStatus('error', 'Please enter both your Admin Cred username and password.');
        return;
      }
      this.setCredentials(u, p, true);
      this.hideStatus();
    });
  }

          bindEvents()       {
    if (this.bubbleBtn) {
      this.bubbleBtn.addEventListener('click', () => this.toggleModal());
    }
    const closeBtn = this.container.querySelector('.n8n-admin-close-btn');
    closeBtn?.addEventListener('click', () => this.toggleModal(false));

    const tabBtns = this.container.querySelectorAll                   ('.n8n-admin-tab');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn.getAttribute('data-tab')                  ) || 'file';
        this.switchTab(tab);
      });
    });

    const chips = this.container.querySelectorAll                   ('.n8n-admin-chip');
    const catInput = this.container.querySelector                  ('#n8n-admin-category-input');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-category') || '';
        if (catInput && val) {
          catInput.value = val;
        }
      });
    });

    const dropzone = this.container.querySelector             ('#n8n-admin-dropzone') ;
    const fileInput = this.container.querySelector                  ('#n8n-admin-file-input') ;

    dropzone.addEventListener('click', (e) => {
      if ((e.target               ).closest('#n8n-admin-remove-file')) return;
      fileInput.click();
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('is-dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        this.setSelectedFile(file);
      }
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0] || null;
      this.setSelectedFile(file);
    });

    const form = this.container.querySelector                 ('#n8n-admin-ingest-form') ;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    const clearBtn = this.container.querySelector('#n8n-admin-clear-history');
    clearBtn?.addEventListener('click', () => {
      this.history = [];
      this.saveHistory();
      this.renderHistory();
    });
  }

          switchTab(tab                )       {
    this.activeTab = tab;
    const tabBtns = this.container.querySelectorAll                   ('.n8n-admin-tab');
    tabBtns.forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-tab') === tab);
    });

    const filePane = this.container.querySelector('#n8n-admin-pane-file') ;
    const urlPane = this.container.querySelector('#n8n-admin-pane-url') ;
    const submitLabel = this.container.querySelector('#n8n-admin-submit-label') ;

    if (tab === 'file') {
      filePane.classList.remove('n8n-hidden');
      urlPane.classList.add('n8n-hidden');
      submitLabel.textContent = 'Upload & Index Document into Knowledge Base';
    } else {
      filePane.classList.add('n8n-hidden');
      urlPane.classList.remove('n8n-hidden');
      submitLabel.textContent = 'Scrape & Index Website URL into Knowledge Base';
    }
    this.hideStatus();
  }

          setSelectedFile(file             )       {
    this.selectedFile = file;
    const promptEl = this.container.querySelector('#n8n-admin-dropzone-prompt') ;
    const selectedEl = this.container.querySelector('#n8n-admin-selected-file') ;

    if (!file) {
      promptEl.classList.remove('n8n-hidden');
      selectedEl.classList.add('n8n-hidden');
      selectedEl.innerHTML = '';
      return;
    }

    const sizeKB = (file.size / 1024).toFixed(1);
    promptEl.classList.add('n8n-hidden');
    selectedEl.classList.remove('n8n-hidden');
    selectedEl.innerHTML = `
      <div class="n8n-admin-file-info">
        <strong>${this.escapeHTML(file.name)}</strong>
        <span>${sizeKB} KB</span>
      </div>
      <button type="button" class="n8n-admin-remove-file" id="n8n-admin-remove-file">Remove</button>
    `;

    selectedEl.querySelector('#n8n-admin-remove-file')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const fileInput = this.container.querySelector                  ('#n8n-admin-file-input');
      if (fileInput) fileInput.value = '';
      this.setSelectedFile(null);
    });
  }

          toggleModal(forceState          )       {
    this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
    this.windowEl.classList.toggle('n8n-hidden', !this.isOpen);
  }

          showStatus(type                                 , message        )       {
    const statusEl = this.container.querySelector             ('#n8n-admin-status');
    if (!statusEl) return;
    statusEl.className = `n8n-admin-status is-${type}`;
    statusEl.textContent = message;
  }

          hideStatus()       {
    const statusEl = this.container.querySelector             ('#n8n-admin-status');
    if (!statusEl) return;
    statusEl.className = 'n8n-admin-status n8n-hidden';
    statusEl.textContent = '';
  }

          async handleSubmit()                {
    if (this.isSubmitting) return;

    const userInput = this.container.querySelector                  ('#n8n-admin-user-input');
    const passInput = this.container.querySelector                  ('#n8n-admin-pass-input');
    if (userInput && passInput && userInput.value.trim() && passInput.value) {
      this.setCredentials(userInput.value.trim(), passInput.value, true);
    }

    if (!this.adminUsername || !this.adminPassword) {
      this.showCredsForm = true;
      this.renderCredsState();
      this.showStatus('error', 'Please enter your Admin Cred username and password first.');
      return;
    }

    const category =
      this.container
        .querySelector                  ('#n8n-admin-category-input')
        ?.value.trim() || 'General Knowledge Base';
    const visibility = (this.container.querySelector                   (
      '#n8n-admin-visibility-select'
    )?.value || 'public')                     ;
    const urlValue =
      this.container.querySelector                  ('#n8n-admin-url-input')?.value.trim() || '';

    if (this.activeTab === 'file' && !this.selectedFile) {
      this.showStatus('error', 'Please select a document (.pdf, .doc, .csv, .xlsx, .txt) to upload.');
      return;
    }

    if (this.activeTab === 'url' && !urlValue) {
      this.showStatus('error', 'Please enter a valid Website URL (https://...) to scrape and index.');
      return;
    }

    this.isSubmitting = true;
    const submitBtn = this.container.querySelector                   ('#n8n-admin-submit-btn') ;
    const submitLabel = this.container.querySelector             ('#n8n-admin-submit-label') ;
    const originalBtnText = submitLabel.textContent || 'Submit';
    submitBtn.disabled = true;
    submitLabel.textContent = 'Chunking, Embedding & Syncing Hybrid Indexes...';

    const sourceLabel = this.activeTab === 'file' ? this.selectedFile .name : urlValue;
    this.showStatus(
      'loading',
      `Ingesting "${sourceLabel}" into chat_rag (800/150 chunks + PGVector + BM25 FTS)...`
    );

    try {
      const authHeader = this.getBasicAuthHeader();
      let response          ;

      if (this.activeTab === 'file') {
        const formData = new FormData();
        formData.append('source_type', 'file');
        formData.append('category', category);
        formData.append('Document Category / Context Header', category);
        formData.append('visibility', visibility);
        formData.append('Visibility Role', visibility);
        formData.append('fileName', this.selectedFile .name);
        formData.append('data', this.selectedFile , this.selectedFile .name);

        response = await fetch(this.config.apiUrl, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
          },
          body: formData,
        });
      } else {
        response = await fetch(this.config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            source_type: 'url',
            url: urlValue,
            'Website url': urlValue,
            category,
            'Document Category / Context Header': category,
            visibility,
            'Visibility Role': visibility,
            bot_id: this.config.botId,
          }),
        });
      }

      if (response.status === 401 || response.status === 403) {
        this.showCredsForm = true;
        this.renderCredsState();
        throw new Error('Authentication failed: Invalid Admin Cred username or password.');
      }

      if (!response.ok) {
        let errDetail = `Server returned HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.detail) errDetail = errJson.detail;
          else if (errJson?.message) errDetail = errJson.message;
        } catch {
          // Ignore JSON parse error
        }
        throw new Error(errDetail);
      }

      let data      = {};
      try {
        data = await response.json();
      } catch {
        data = { status: 'ok' };
      }

      const row = Array.isArray(data) && data[0] ? data[0] : data;
      const totalChunks =
        typeof row?.total_chunks === 'number' ? row.total_chunks : undefined;
      if (totalChunks !== undefined) {
        this.totalChunksCount = totalChunks;
        const pill = this.container.querySelector             ('#n8n-admin-chunk-pill');
        if (pill) {
          pill.style.display = '';
          pill.textContent = `${totalChunks} chunks in chat_rag`;
        }
      }

      const successMsg =
        row?.message ||
        `Successfully indexed "${sourceLabel}" (${visibility} scope) into Hybrid RAG.`;

      const logEntry                   = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        sourceType: this.activeTab,
        sourceLabel,
        category,
        visibility,
        status: 'success',
        message: successMsg,
        totalChunks,
        timestamp: Date.now(),
      };

      this.history.unshift(logEntry);
      this.saveHistory();
      this.renderHistory();
      this.showStatus('success', successMsg);

      if (this.activeTab === 'file') {
        const fileInput = this.container.querySelector                  ('#n8n-admin-file-input');
        if (fileInput) fileInput.value = '';
        this.setSelectedFile(null);
      } else {
        const urlInput = this.container.querySelector                  ('#n8n-admin-url-input');
        if (urlInput) urlInput.value = '';
      }

      this.onIngestSuccess?.(logEntry, data);
    } catch (err     ) {
      const errMsg = err?.message || 'Failed to ingest knowledge into vector store.';
      const logEntry                   = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        sourceType: this.activeTab,
        sourceLabel,
        category,
        visibility,
        status: 'error',
        message: errMsg,
        timestamp: Date.now(),
      };
      this.history.unshift(logEntry);
      this.saveHistory();
      this.renderHistory();
      this.showStatus('error', errMsg);
      this.onIngestError?.(err instanceof Error ? err : new Error(errMsg));
    } finally {
      this.isSubmitting = false;
      submitBtn.disabled = false;
      submitLabel.textContent = originalBtnText;
    }
  }

          renderHistory()       {
    const listEl = this.container.querySelector             ('#n8n-admin-history-list');
    if (!listEl) return;

    if (this.history.length === 0) {
      listEl.innerHTML = `<div class="n8n-admin-history-empty">No documents or URLs ingested from this browser session yet.</div>`;
      return;
    }

    listEl.innerHTML = this.history
      .slice(0, 8)
      .map((item) => {
        const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        return `
          <div class="n8n-admin-history-item is-${item.status}">
            <div class="n8n-admin-history-main">
              <span class="n8n-admin-badge-type">${item.sourceType.toUpperCase()}</span>
              <strong class="n8n-admin-history-source">${this.escapeHTML(item.sourceLabel)}</strong>
              <span class="n8n-admin-badge-role role-${item.visibility}">${this.escapeHTML(
                item.visibility
              )}</span>
              <span class="n8n-admin-badge-cat">${this.escapeHTML(item.category)}</span>
            </div>
            <div class="n8n-admin-history-meta">
              <span>${item.status === 'success' ? '✓ Indexed' : '✕ Failed'}</span>
              <span>${timeStr}</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

          escapeHTML(str        )         {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

         destroy()       {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

function createAdminRag(config                )                 {
  return new AdminRagWidget(config);
}








                
                    
                                           
                      
                                            
                                            
      
   
 

if (typeof window !== 'undefined') {
  window.createAdminRag = createAdminRag;
  window.N8nAdminWidget = {
    createAdminRag,
    AdminRagWidget,
  };

  // Auto-mount if script tag includes data-api-url:
  // <script src="admin-widget.bundle.js" data-api-url="https://..." data-target="#admin-rag-portal"></script>
  const currentScript =
    document.currentScript ||
    document.querySelector('script[data-api-url], script[data-admin-api-url]');

  if (currentScript) {
    const apiUrl =
      currentScript.getAttribute('data-api-url') ||
      currentScript.getAttribute('data-admin-api-url');
    if (apiUrl) {
      const config                 = {
        apiUrl,
        target: currentScript.getAttribute('data-target') || undefined,
        mode: (currentScript.getAttribute('data-mode')       ) || undefined,
        botId: currentScript.getAttribute('data-bot-id') || undefined,
        title: currentScript.getAttribute('data-title') || undefined,
        subtitle: currentScript.getAttribute('data-subtitle') || undefined,
        primaryColor: currentScript.getAttribute('data-primary-color') || undefined,
        position: (currentScript.getAttribute('data-position')       ) || undefined,
        adminUsername: currentScript.getAttribute('data-admin-username') || undefined,
        adminPassword: currentScript.getAttribute('data-admin-password') || undefined,
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => createAdminRag(config));
      } else {
        createAdminRag(config);
      }
    }
  }
}

export { AdminRagWidget, createAdminRag };
