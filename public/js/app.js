/**
 * 主应用程序
 */

class CookieAdminApp {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.charts = {};
        this.selectedCookies = new Set();
        this.autoRefreshEnabled = true;
        this.autoRefreshInterval = 30000;
        this.autoRefreshTimer = null;
        this.sortField = null;
        this.sortDirection = 'asc';
        this.cachedCookies = [];
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        this.loadTheme();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        await this.loadDashboard();
        await this.checkServerStatus();
        this.setupAutoRefresh();
    }

    /* ==========================================
     * THEME
     * ========================================== */

    loadTheme() {
        const saved = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        this.updateThemeIcon(saved);
        const sel = document.getElementById('themeSelect');
        if (sel) sel.value = saved;
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        this.updateThemeIcon(next);
        const sel = document.getElementById('themeSelect');
        if (sel) sel.value = next;
        // Re-render charts with correct theme colors
        if (document.getElementById('dashboard').classList.contains('active')) {
            this.loadDashboard();
        }
    }

    updateThemeIcon(theme) {
        const btn = document.getElementById('themeToggle');
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }

    /* ==========================================
     * SIDEBAR
     * ========================================== */

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }

    /* ==========================================
     * EVENT LISTENERS
     * ========================================== */

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('sidebarOverlay').addEventListener('click', () => this.closeSidebar());

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('theme', theme);
                this.updateThemeIcon(theme);
                if (document.getElementById('dashboard').classList.contains('active')) {
                    this.loadDashboard();
                }
            });
        }

        // Auto-refresh toggle
        document.getElementById('autoRefreshToggle').addEventListener('click', () => this.toggleAutoRefresh());
        const refreshIntervalSelect = document.getElementById('refreshInterval');
        if (refreshIntervalSelect) {
            refreshIntervalSelect.addEventListener('change', (e) => {
                const val = parseInt(e.target.value);
                if (val === 0) {
                    this.autoRefreshEnabled = false;
                    this.clearAutoRefresh();
                    this.updateAutoRefreshUI();
                } else {
                    this.autoRefreshInterval = val;
                    this.autoRefreshEnabled = true;
                    this.setupAutoRefresh();
                    this.updateAutoRefreshUI();
                }
            });
        }

        // Shortcut help
        document.getElementById('shortcutHelpBtn').addEventListener('click', () => {
            document.getElementById('shortcutModal').classList.add('show');
        });

        // 标签页切换
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e));
        });

        // Dashboard
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshCurrentTab());

        // Cookie列表
        document.getElementById('searchBtn').addEventListener('click', () => this.loadCookies());
        document.getElementById('searchIP').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.loadCookies();
        });
        document.getElementById('pageSize').addEventListener('change', () => {
            this.pageSize = parseInt(document.getElementById('pageSize').value);
            this.currentPage = 1;
            this.loadCookies();
        });
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadCookies();
            }
        });
        document.getElementById('nextPage').addEventListener('click', () => {
            this.currentPage++;
            this.loadCookies();
        });
        document.getElementById('selectAll').addEventListener('change', (e) => this.selectAllCookies(e));

        // Sortable headers
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => this.handleSort(th));
        });

        // 导入Cookie
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchImportMethod(e));
        });
        document.getElementById('fileDropZone').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        document.getElementById('fileDropZone').addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#667eea';
        });
        document.getElementById('fileDropZone').addEventListener('dragleave', (e) => {
            e.currentTarget.style.borderColor = '#d9d9d9';
        });
        document.getElementById('fileDropZone').addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#d9d9d9';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('fileInput').files = files;
                this.handleFileSelected();
            }
        });
        document.getElementById('fileInput').addEventListener('change', () => this.handleFileSelected());
        document.getElementById('importBtn').addEventListener('click', () => this.importCookies());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearImportForm());

        // 批量操作
        document.getElementById('batchValidateBtn').addEventListener('click', () => this.batchValidate());
        document.getElementById('batchBlacklistBtn').addEventListener('click', () => this.batchBlacklist());
        document.getElementById('batchReleaseBtn').addEventListener('click', () => this.batchRelease());
        document.getElementById('batchDeleteBtn').addEventListener('click', () => this.batchDelete());
        document.getElementById('batchInput').addEventListener('input', () => this.updateBatchPreview());

        // 设置
        document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportCSV());
        document.getElementById('exportJsonBtn').addEventListener('click', () => this.exportJSON());
        document.getElementById('cleanInvalidBtn').addEventListener('click', () => this.cleanInvalid());
        document.getElementById('cleanBlacklistBtn').addEventListener('click', () => this.cleanBlacklist());

        // 模态框
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('show');
            });
        });
        document.getElementById('cancelBtn').addEventListener('click', () => {
            document.getElementById('confirmModal').classList.remove('show');
        });

        // 编辑模态框事件处理
        const editModal = document.getElementById('editModal');
        const editCancelBtn = document.getElementById('editCancelBtn');
        const editSaveBtn = document.getElementById('editSaveBtn');

        editCancelBtn.addEventListener('click', () => {
            this.closeEditModal();
        });

        editSaveBtn.addEventListener('click', () => {
            this.saveCookie();
        });

        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                this.closeEditModal();
            }
        });

        // 表格操作按钮事件委托
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.getAttribute('data-action');
            const id = button.getAttribute('data-id');

            if (action && id) {
                switch (action) {
                    case 'edit':
                        this.editCookie(id);
                        break;
                    case 'validate':
                        this.validateSingle(id);
                        break;
                    case 'release':
                        this.releaseSingle(id);
                        break;
                    case 'blacklist':
                        this.blacklistSingle(id);
                        break;
                    case 'delete':
                        this.deleteSingle(id);
                        break;
                    case 'copy-cookie':
                        this.copyCookieValue(id, e);
                        break;
                }
            }
        });
    }

    /* ==========================================
     * KEYBOARD SHORTCUTS
     * ========================================== */

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if user is typing in an input/textarea
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') {
                if (e.key === 'Escape') {
                    e.target.blur();
                }
                return;
            }

            // Skip if modifier keys pressed
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            switch (e.key.toLowerCase()) {
                case 'r':
                    e.preventDefault();
                    this.refreshCurrentTab();
                    break;
                case '/':
                    e.preventDefault();
                    this.focusSearch();
                    break;
                case 'escape':
                    this.closeAllModals();
                    this.closeSidebar();
                    break;
                case 'd':
                    e.preventDefault();
                    this.toggleTheme();
                    break;
                case '1':
                    this.switchTabByIndex(0);
                    break;
                case '2':
                    this.switchTabByIndex(1);
                    break;
                case '3':
                    this.switchTabByIndex(2);
                    break;
                case '4':
                    this.switchTabByIndex(3);
                    break;
                case '5':
                    this.switchTabByIndex(4);
                    break;
            }
        });
    }

    focusSearch() {
        const searchInput = document.getElementById('searchIP');
        if (searchInput) {
            // Switch to cookies tab first if not there
            const cookiesTab = document.querySelector('[data-tab="cookies"]');
            if (cookiesTab && !cookiesTab.classList.contains('active')) {
                cookiesTab.click();
            }
            setTimeout(() => searchInput.focus(), 100);
        }
    }

    switchTabByIndex(index) {
        const tabs = document.querySelectorAll('.nav-item');
        if (tabs[index]) {
            tabs[index].click();
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
        const editModal = document.getElementById('editModal');
        if (editModal && editModal.style.display === 'flex') {
            this.closeEditModal();
        }
    }

    refreshCurrentTab() {
        const activeTab = document.querySelector('.tab-content.active');
        if (!activeTab) return;
        const id = activeTab.id;
        if (id === 'dashboard') {
            this.loadDashboard();
        } else if (id === 'cookies') {
            this.loadCookies();
        }
        // Brief spin animation on refresh button
        const btn = document.getElementById('refreshBtn');
        const icon = btn.querySelector('i');
        icon.classList.add('loading');
        setTimeout(() => icon.classList.remove('loading'), 1000);
    }

    /* ==========================================
     * AUTO REFRESH
     * ========================================== */

    setupAutoRefresh() {
        this.clearAutoRefresh();
        if (!this.autoRefreshEnabled || this.autoRefreshInterval <= 0) return;
        this.autoRefreshTimer = setInterval(() => {
            if (document.getElementById('dashboard').classList.contains('active')) {
                this.loadDashboard();
            }
        }, this.autoRefreshInterval);
        this.updateAutoRefreshUI();
    }

    clearAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
            this.autoRefreshTimer = null;
        }
    }

    toggleAutoRefresh() {
        this.autoRefreshEnabled = !this.autoRefreshEnabled;
        if (this.autoRefreshEnabled) {
            this.setupAutoRefresh();
        } else {
            this.clearAutoRefresh();
        }
        this.updateAutoRefreshUI();
    }

    updateAutoRefreshUI() {
        const toggle = document.getElementById('autoRefreshToggle');
        const dot = toggle.querySelector('.auto-refresh-dot');
        if (this.autoRefreshEnabled) {
            dot.className = 'auto-refresh-dot active';
            toggle.title = '自动刷新已开启 (点击关闭)';
        } else {
            dot.className = 'auto-refresh-dot paused';
            toggle.title = '自动刷新已关闭 (点击开启)';
        }
    }

    /* ==========================================
     * TAB SWITCHING
     * ========================================== */

    switchTab(e) {
        e.preventDefault();
        const tab = e.currentTarget.getAttribute('data-tab');

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        e.currentTarget.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tab).classList.add('active');

        if (tab === 'dashboard') {
            this.loadDashboard();
        } else if (tab === 'cookies') {
            this.loadCookies();
        }

        // Close sidebar on mobile
        this.closeSidebar();
    }

    /* ==========================================
     * SKELETON LOADING
     * ========================================== */

    showStatsSkeleton() {
        const grid = document.getElementById('statsGrid');
        if (!grid) return;
        grid.querySelectorAll('.stat-value').forEach(el => {
            el.innerHTML = '<div class="skeleton skeleton-value"></div>';
        });
    }

    showTableSkeleton() {
        const tbody = document.getElementById('cookieTable');
        if (!tbody) return;
        let rows = '';
        for (let i = 0; i < 5; i++) {
            rows += `<tr>
                <td><div class="skeleton" style="width:18px;height:18px;"></div></td>
                <td><div class="skeleton skeleton-cell" style="width:30px;height:16px;"></div></td>
                <td><div class="skeleton skeleton-cell" style="width:100px;height:16px;"></div></td>
                <td><div class="skeleton skeleton-cell" style="width:150px;height:16px;"></div></td>
                <td><div class="skeleton skeleton-cell" style="width:60px;height:16px;"></div></td>
                <td><div class="skeleton skeleton-cell" style="width:50px;height:16px;"></div></td>
                <td><div class="skeleton skeleton-cell" style="width:100px;height:16px;"></div></td>
                <td><div class="skeleton skeleton-cell" style="width:100px;height:16px;"></div></td>
                <td><div class="skeleton skeleton-cell" style="width:160px;height:16px;"></div></td>
            </tr>`;
        }
        tbody.innerHTML = rows;
    }

    /* ==========================================
     * DASHBOARD
     * ========================================== */

    async loadDashboard() {
        this.showStatsSkeleton();
        try {
            const data = await api.getStatistics();
            if (data && data.code === 200 && data.data) {
                const stats = data.data;

                const totalCookies = parseInt(stats.total) || 0;
                const availableCookies = parseInt(stats.available) || 0;
                const usingCookies = parseInt(stats.using) || 0;
                const invalidCookies = parseInt(stats.invalid) || 0;
                const blacklistCookies = parseInt(stats.blacklist) || 0;
                const avgUseCount = parseFloat(stats.avgUseCount) || 0;

                const elements = {
                    'totalCookies': totalCookies,
                    'availableCookies': availableCookies,
                    'usingCookies': usingCookies,
                    'invalidCookies': invalidCookies,
                    'blacklistCookies': blacklistCookies,
                    'avgUseCount': avgUseCount.toFixed(2)
                };

                for (const [id, value] of Object.entries(elements)) {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = value;
                    }
                }

                this.updateCharts({
                    total: totalCookies,
                    available: availableCookies,
                    using: usingCookies,
                    invalid: invalidCookies,
                    blacklist: blacklistCookies,
                });
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            console.error('Dashboard error:', error);
            this.showNotification('获取统计数据失败：' + (error.message || '未知错误'), 'error');
        }
    }

    updateCharts(stats) {
        try {
            if (typeof Chart === 'undefined') {
                console.error('Chart.js is not loaded');
                return;
            }

            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            const textColor = isDark ? '#cbd5e1' : '#4b5563';

            const data = {
                total: parseInt(stats.total) || 0,
                available: parseInt(stats.available) || 0,
                using: parseInt(stats.using) || 0,
                invalid: parseInt(stats.invalid) || 0,
                blacklist: parseInt(stats.blacklist) || 0,
            };

            const statusCtx = document.getElementById('statusChart');
            if (!statusCtx) return;

            if (this.charts.statusChart) {
                this.charts.statusChart.destroy();
            }

            this.charts.statusChart = new Chart(statusCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['可用', '使用中', '失效', '黑名单'],
                    datasets: [{
                        data: [data.available, data.using, data.invalid, data.blacklist],
                        backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#8b5cf6'],
                        borderColor: isDark ? '#1e293b' : '#ffffff',
                        borderWidth: 2,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: textColor },
                        },
                    },
                },
            });

            const usageCtx = document.getElementById('usageChart');
            if (!usageCtx) return;

            if (this.charts.usageChart) {
                this.charts.usageChart.destroy();
            }

            this.charts.usageChart = new Chart(usageCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['总数', '可用', '使用中', '失效', '黑名单'],
                    datasets: [{
                        label: '数量',
                        data: [data.total, data.available, data.using, data.invalid, data.blacklist],
                        backgroundColor: ['#6366f1', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'],
                        borderRadius: 6,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: gridColor },
                            ticks: { color: textColor },
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: textColor },
                        },
                    },
                },
            });
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    /* ==========================================
     * COOKIE LIST
     * ========================================== */

    async loadCookies() {
        this.showTableSkeleton();
        try {
            const ip = document.getElementById('searchIP').value;
            const status = document.getElementById('statusFilter').value;

            const data = await api.getCookies(this.currentPage, this.pageSize, status, ip);
            if (data.code === 200) {
                this.cachedCookies = data.data.data;
                if (this.sortField) {
                    this.sortCookies();
                }
                this.renderCookieTable(this.cachedCookies);
                this.updatePagination(data.data.pagination);
            }
        } catch (error) {
            this.showNotification('加载Cookie列表失败', 'error');
            console.error(error);
        }
    }

    /* ==========================================
     * TABLE SORTING
     * ========================================== */

    handleSort(th) {
        const field = th.getAttribute('data-sort');
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        // Update UI
        document.querySelectorAll('.sortable').forEach(h => {
            h.classList.remove('sort-asc', 'sort-desc');
        });
        th.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');

        this.sortCookies();
        this.renderCookieTable(this.cachedCookies);
    }

    sortCookies() {
        if (!this.sortField || !this.cachedCookies.length) return;
        const field = this.sortField;
        const dir = this.sortDirection === 'asc' ? 1 : -1;
        this.cachedCookies.sort((a, b) => {
            const va = a[field] ?? 0;
            const vb = b[field] ?? 0;
            if (typeof va === 'number' && typeof vb === 'number') {
                return (va - vb) * dir;
            }
            return String(va).localeCompare(String(vb)) * dir;
        });
    }

    /* ==========================================
     * RENDER TABLE
     * ========================================== */

    renderCookieTable(cookies) {
        const tbody = document.getElementById('cookieTable');
        if (cookies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center">暂无数据</td></tr>';
            return;
        }

        const statusMap = {
            0: { text: '可用', class: 'status-available' },
            1: { text: '使用中', class: 'status-using' },
            2: { text: '失效', class: 'status-invalid' },
            3: { text: '黑名单', class: 'status-blacklist' },
        };

        tbody.innerHTML = cookies.map(cookie => {
            const cookiePreview = cookie.cookie
                ? (cookie.cookie.length > 40 ? cookie.cookie.substring(0, 40) + '...' : cookie.cookie)
                : '-';

            return `
            <tr>
                <td><input type="checkbox" class="table-checkbox" value="${cookie.id}"></td>
                <td>${cookie.id}</td>
                <td>${cookie.ip}</td>
                <td>
                    <span class="cookie-preview" data-action="copy-cookie" data-id="${cookie.id}" title="点击复制完整Cookie">
                        ${this.escapeHtml(cookiePreview)}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${statusMap[cookie.status].class}">
                        ${statusMap[cookie.status].text}
                    </span>
                </td>
                <td>${cookie.use_count}</td>
                <td>${this.formatTime(cookie.last_used_time)}</td>
                <td>${this.formatTime(cookie.last_check_time)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-action btn-edit" title="编辑" data-action="edit" data-id="${cookie.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-action btn-validate" title="验证" data-action="validate" data-id="${cookie.id}">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-action btn-release" title="释放" data-action="release" data-id="${cookie.id}">
                            <i class="fas fa-unlock"></i>
                        </button>
                        <button class="btn btn-action btn-blacklist" title="黑名单" data-action="blacklist" data-id="${cookie.id}">
                            <i class="fas fa-ban"></i>
                        </button>
                        <button class="btn btn-action btn-delete" title="删除" data-action="delete" data-id="${cookie.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        document.querySelectorAll('.table-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectAll());
        });
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /* ==========================================
     * COPY COOKIE
     * ========================================== */

    async copyCookieValue(id, event) {
        const cookie = this.cachedCookies.find(c => String(c.id) === String(id));
        if (!cookie || !cookie.cookie) return;

        try {
            await navigator.clipboard.writeText(cookie.cookie);
            // Visual feedback
            const el = event.target.closest('.cookie-preview');
            if (el) {
                el.classList.add('copied');
                setTimeout(() => el.classList.remove('copied'), 1000);
            }
            this.showTooltip(event, '已复制');
        } catch (err) {
            this.showNotification('复制失败', 'error');
        }
    }

    showTooltip(event, text) {
        const tip = document.createElement('div');
        tip.className = 'copy-tooltip';
        tip.textContent = text;
        tip.style.left = event.clientX + 'px';
        tip.style.top = (event.clientY - 30) + 'px';
        document.body.appendChild(tip);
        setTimeout(() => tip.remove(), 1000);
    }

    /* ==========================================
     * PAGINATION
     * ========================================== */

    updatePagination(pagination) {
        document.getElementById('pageInfo').textContent = `第 ${pagination.page} / ${pagination.totalPages} 页`;
        document.getElementById('prevPage').disabled = pagination.page <= 1;
        document.getElementById('nextPage').disabled = pagination.page >= pagination.totalPages;
    }

    /* ==========================================
     * COOKIE DETAIL
     * ========================================== */

    async showDetail(id) {
        try {
            const data = await api.getCookieDetail(id);
            if (data.code === 200) {
                const cookie = data.data;
                const modalBody = document.getElementById('modalBody');
                const statusMap = { 0: '可用', 1: '使用中', 2: '失效', 3: '黑名单' };
                modalBody.innerHTML = `
                    <div style="line-height: 2;">
                        <p><strong>ID:</strong> ${cookie.id}</p>
                        <p><strong>IP:</strong> ${cookie.ip}</p>
                        <p><strong>状态:</strong> ${statusMap[cookie.status]}</p>
                        <p><strong>使用次数:</strong> ${cookie.use_count}</p>
                        <p><strong>最后使用:</strong> ${this.formatTime(cookie.last_used_time)}</p>
                        <p><strong>最后检测:</strong> ${this.formatTime(cookie.last_check_time)}</p>
                        <p><strong>有效期至:</strong> ${this.formatTime(cookie.valid_until)}</p>
                        <p><strong>Cookie:</strong> <code style="background: var(--bg-tertiary); padding: 4px; border-radius: 2px; word-break: break-all;">${this.escapeHtml(cookie.cookie)}</code></p>
                        ${cookie.error_msg ? `<p style="color: var(--danger-color);"><strong>错误:</strong> ${this.escapeHtml(cookie.error_msg)}</p>` : ''}
                        <p><strong>创建时间:</strong> ${this.formatTime(cookie.created_at)}</p>
                    </div>
                `;
                document.getElementById('detailModal').classList.add('show');
            }
        } catch (error) {
            this.showNotification('获取Cookie详情失败', 'error');
            console.error(error);
        }
    }

    /* ==========================================
     * SINGLE ACTIONS
     * ========================================== */

    async validateSingle(id) {
        try {
            const data = await api.validateCookie(id);
            if (data.code === 200) {
                this.showNotification(`Cookie验证完成: ${data.data.valid ? '有效' : '无效'}`, 'success');
                this.loadCookies();
            }
        } catch (error) {
            this.showNotification('验证Cookie失败', 'error');
            console.error(error);
        }
    }

    blacklistSingle(id) {
        this.showConfirm('确认操作', '确定要添加到黑名单吗?', async () => {
            try {
                const data = await api.blacklistCookie(id, '手动添加');
                if (data.code === 200) {
                    this.showNotification('已添加到黑名单', 'success');
                    this.loadCookies();
                }
            } catch (error) {
                this.showNotification('操作失败', 'error');
                console.error(error);
            }
        });
    }

    async editCookie(id) {
        try {
            const data = await api.getCookieDetail(id);
            if (data.code === 200) {
                const cookie = data.data;
                document.getElementById('editId').value = cookie.id;
                document.getElementById('editIp').value = cookie.ip;
                document.getElementById('editCookie').value = cookie.cookie;

                if (cookie.valid_until) {
                    const date = new Date(cookie.valid_until);
                    const localDatetime = date.toISOString().slice(0, 16);
                    document.getElementById('editValidUntil').value = localDatetime;
                }

                document.getElementById('editStatus').value = cookie.status;

                const modal = document.getElementById('editModal');
                modal.style.display = 'flex';
                this.currentEditingId = id;
            }
        } catch (error) {
            this.showNotification('获取Cookie详情失败', 'error');
            console.error(error);
        }
    }

    async saveCookie() {
        const id = document.getElementById('editId').value;
        const ip = document.getElementById('editIp').value;
        const cookie = document.getElementById('editCookie').value;
        const validUntil = document.getElementById('editValidUntil').value;
        const status = document.getElementById('editStatus').value;

        if (!ip || !cookie) {
            this.showNotification('请填写IP地址和Cookie值', 'error');
            return;
        }

        try {
            let validUntilTimestamp = null;
            if (validUntil) {
                validUntilTimestamp = new Date(validUntil).toISOString();
            }

            const updateData = {
                ip,
                cookie,
                valid_until: validUntilTimestamp,
                status: parseInt(status)
            };

            const data = await api.updateCookie(id, updateData);
            if (data.code === 200) {
                this.showNotification('Cookie已保存', 'success');
                this.closeEditModal();
                this.loadCookies();
            } else {
                this.showNotification(data.message || '保存失败', 'error');
            }
        } catch (error) {
            this.showNotification('保存Cookie失败', 'error');
            console.error(error);
        }
    }

    deleteSingle(id) {
        this.showConfirm('确认操作', '确定要删除这个Cookie吗?', async () => {
            try {
                const data = await api.deleteCookie(id);
                if (data.code === 200) {
                    this.showNotification('Cookie已删除', 'success');
                    this.loadCookies();
                } else {
                    this.showNotification(data.message || '删除失败', 'error');
                }
            } catch (error) {
                this.showNotification('删除Cookie失败', 'error');
                console.error(error);
            }
        });
    }

    async releaseSingle(id) {
        try {
            const data = await api.releaseCookie(id);
            if (data.code === 200) {
                this.showNotification('Cookie已释放', 'success');
                this.loadCookies();
            } else {
                this.showNotification(data.message || '释放失败', 'error');
            }
        } catch (error) {
            this.showNotification('释放Cookie失败', 'error');
            console.error(error);
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        modal.style.display = 'none';
        this.currentEditingId = null;
    }

    /* ==========================================
     * IMPORT
     * ========================================== */

    switchImportMethod(e) {
        const method = e.currentTarget.getAttribute('data-method');
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        e.currentTarget.classList.add('active');

        document.querySelectorAll('.method-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${method}-method`).classList.add('active');
    }

    handleFileSelected() {
        const file = document.getElementById('fileInput').files[0];
        if (!file) return;
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileInfo').style.display = 'block';
    }

    async importCookies() {
        const method = document.querySelector('.method-tab.active').getAttribute('data-method');
        let cookieLines = [];

        if (method === 'textarea') {
            cookieLines = document.getElementById('cookieInput').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
        } else {
            const file = document.getElementById('fileInput').files[0];
            if (!file) {
                this.showNotification('请选择文件', 'warning');
                return;
            }
            const text = await file.text();
            cookieLines = text.split('\n').map(line => line.trim()).filter(line => line);
        }

        if (cookieLines.length === 0) {
            this.showNotification('请输入要导入的Cookie', 'warning');
            return;
        }

        document.getElementById('pendingCount').textContent = cookieLines.length;
        document.getElementById('progressArea').style.display = 'block';

        const cookies = cookieLines.map(line => {
            const parts = line.split(/\s+/);
            return {
                ip: parts[0],
                cookie: parts.slice(1, -1).join(' ') || parts.slice(1).join(' '),
                validUntil: parts.length > 2 ? parts[parts.length - 1] : undefined,
            };
        });

        try {
            const data = await api.importCookies(cookies);
            if (data.code === 200) {
                document.getElementById('successCount').textContent = data.data.success;
                document.getElementById('failCount').textContent = data.data.failed;
                document.getElementById('progressFill').style.width = '100%';
                document.getElementById('progressText').textContent = '导入完成！';
                this.showNotification(`导入完成: 成功${data.data.success}条，失败${data.data.failed}条`, 'success');
                this.loadDashboard();
            }
        } catch (error) {
            this.showNotification('导入失败', 'error');
            console.error(error);
        }
    }

    clearImportForm() {
        document.getElementById('cookieInput').value = '';
        document.getElementById('fileInput').value = '';
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('progressArea').style.display = 'none';
        document.getElementById('pendingCount').textContent = '0';
        document.getElementById('successCount').textContent = '0';
        document.getElementById('failCount').textContent = '0';
        document.getElementById('progressFill').style.width = '0%';
    }

    /* ==========================================
     * BATCH OPERATIONS
     * ========================================== */

    async batchValidate() {
        const ids = this.parseBatchInput();
        if (ids.length === 0) {
            this.showNotification('请输入Cookie ID', 'warning');
            return;
        }
        try {
            const data = await api.batchValidateCookies(ids);
            if (data.code === 200) {
                this.showBatchResults(data.data.results);
                this.showNotification('批量验证完成', 'success');
                this.loadCookies();
            }
        } catch (error) {
            this.showNotification('批量验证失败', 'error');
            console.error(error);
        }
    }

    async batchBlacklist() {
        const ids = this.parseBatchInput();
        if (ids.length === 0) {
            this.showNotification('请输入Cookie ID', 'warning');
            return;
        }
        this.showConfirm('确认操作', `确定要添加${ids.length}条Cookie到黑名单吗?`, async () => {
            try {
                for (const id of ids) {
                    await api.blacklistCookie(id, '批量添加');
                }
                this.showNotification('批量添加黑名单完成', 'success');
                this.loadCookies();
            } catch (error) {
                this.showNotification('操作失败', 'error');
                console.error(error);
            }
        });
    }

    async batchRelease() {
        const ids = this.parseBatchInput();
        if (ids.length === 0) {
            this.showNotification('请输入Cookie ID', 'warning');
            return;
        }
        try {
            for (const id of ids) {
                await api.releaseCookie(id);
            }
            this.showNotification(`已释放${ids.length}条Cookie`, 'success');
            this.loadCookies();
        } catch (error) {
            this.showNotification('操作失败', 'error');
            console.error(error);
        }
    }

    async batchDelete() {
        const ids = this.parseBatchInput();
        if (ids.length === 0) {
            this.showNotification('请输入Cookie ID', 'warning');
            return;
        }
        this.showConfirm('确认删除', `确定要删除${ids.length}条Cookie吗?`, async () => {
            try {
                for (const id of ids) {
                    await api.blacklistCookie(id, '批量删除');
                }
                this.showNotification(`已删除${ids.length}条Cookie`, 'success');
                this.loadCookies();
            } catch (error) {
                this.showNotification('删除失败', 'error');
                console.error(error);
            }
        });
    }

    parseBatchInput() {
        const input = document.getElementById('batchInput').value.trim();
        if (!input) return [];
        return input.split(/[,\n\s]+/).filter(id => id && !isNaN(id)).map(id => parseInt(id));
    }

    updateBatchPreview() {
        const ids = this.parseBatchInput();
        const preview = document.getElementById('batchPreview');
        if (ids.length === 0) {
            preview.innerHTML = '<p class="text-muted">选择操作后显示预览...</p>';
        } else {
            preview.innerHTML = `
                <p><strong>已选择${ids.length}条Cookie:</strong></p>
                <p style="word-break: break-all; font-family: monospace; background: var(--bg-tertiary); padding: 10px; border-radius: 4px;">
                    ${ids.join(', ')}
                </p>
            `;
        }
    }

    showBatchResults(results) {
        const resultsDiv = document.getElementById('batchResults');
        const resultsList = document.getElementById('batchResultsList');
        resultsList.innerHTML = results.map(result => `
            <div class="result-item ${result.valid ? 'result-success' : 'result-error'}">
                <strong>ID: ${result.id}</strong> - ${result.ip}
                <p>${result.valid ? '有效' : '无效'}</p>
            </div>
        `).join('');
        resultsDiv.style.display = 'block';
    }

    /* ==========================================
     * EXPORT & CLEANUP
     * ========================================== */

    async exportCSV() {
        try {
            const data = await api.getCookies(1, 999999);
            if (data.code === 200) {
                const cookies = data.data.data;
                const csv = this.generateCSV(cookies);
                this.downloadFile(csv, 'cookies.csv', 'text/csv');
                this.showNotification('导出CSV成功', 'success');
            }
        } catch (error) {
            this.showNotification('导出失败', 'error');
            console.error(error);
        }
    }

    async exportJSON() {
        try {
            const data = await api.getCookies(1, 999999);
            if (data.code === 200) {
                const json = JSON.stringify(data.data.data, null, 2);
                this.downloadFile(json, 'cookies.json', 'application/json');
                this.showNotification('导出JSON成功', 'success');
            }
        } catch (error) {
            this.showNotification('导出失败', 'error');
            console.error(error);
        }
    }

    cleanInvalid() {
        this.showConfirm('确认操作', '确定要清理所有失效的Cookie吗?', async () => {
            try {
                const data = await api.getCookies(1, 999999, '2');
                if (data.code === 200) {
                    const count = data.data.data.length;
                    for (const cookie of data.data.data) {
                        await api.blacklistCookie(cookie.id, '自动清理失效');
                    }
                    this.showNotification(`已清理${count}条失效Cookie`, 'success');
                    this.loadDashboard();
                }
            } catch (error) {
                this.showNotification('清理失败', 'error');
                console.error(error);
            }
        });
    }

    cleanBlacklist() {
        this.showConfirm('确认操作', '确定要清空黑名单吗?', async () => {
            try {
                const data = await api.getCookies(1, 999999, '3');
                if (data.code === 200) {
                    const count = data.data.data.length;
                    this.showNotification(`黑名单中有${count}条Cookie`, 'info');
                }
            } catch (error) {
                this.showNotification('操作失败', 'error');
                console.error(error);
            }
        });
    }

    /* ==========================================
     * SELECT ALL
     * ========================================== */

    selectAllCookies(e) {
        document.querySelectorAll('.table-checkbox').forEach(checkbox => {
            if (checkbox.id !== 'selectAll') {
                checkbox.checked = e.currentTarget.checked;
            }
        });
    }

    updateSelectAll() {
        const checkboxes = document.querySelectorAll('.table-checkbox:not(#selectAll)');
        const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
        document.getElementById('selectAll').checked = checked === checkboxes.length && checkboxes.length > 0;
    }

    /* ==========================================
     * SERVER STATUS
     * ========================================== */

    async checkServerStatus() {
        try {
            await api.healthCheck();
            document.getElementById('serverStatus').style.color = '#10b981';
            document.getElementById('apiUrl').value = '/api';
            document.getElementById('serverInfo').value = '在线';
        } catch (error) {
            document.getElementById('serverStatus').style.color = '#ef4444';
            document.getElementById('serverInfo').value = '离线';
        }
    }

    /* ==========================================
     * NOTIFICATIONS (Enhanced)
     * ========================================== */

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
        };

        const notify = document.createElement('div');
        notify.className = `notify notify-${type}`;
        notify.innerHTML = `
            <i class="notify-icon ${icons[type]}"></i>
            <div class="notify-text">
                <div class="notify-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="notify-close" title="关闭">&times;</button>
            <div class="notify-progress"></div>
        `;

        // Close button
        notify.querySelector('.notify-close').addEventListener('click', () => {
            notify.classList.add('removing');
            setTimeout(() => notify.remove(), 300);
        });

        notification.appendChild(notify);

        // Auto-dismiss
        setTimeout(() => {
            if (notify.parentNode) {
                notify.classList.add('removing');
                setTimeout(() => notify.remove(), 300);
            }
        }, 3000);
    }

    /* ==========================================
     * CONFIRM DIALOG
     * ========================================== */

    showConfirm(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').classList.add('show');

        const confirmBtn = document.getElementById('confirmBtn');
        confirmBtn.onclick = () => {
            document.getElementById('confirmModal').classList.remove('show');
            onConfirm();
        };
    }

    /* ==========================================
     * UTILITIES
     * ========================================== */

    formatTime(time) {
        if (!time) return '-';
        const date = new Date(time);
        return date.toLocaleString('zh-CN');
    }

    generateCSV(cookies) {
        const headers = ['ID', 'IP', '状态', '使用次数', '最后使用', '最后检测'];
        const statusMap = { 0: '可用', 1: '使用中', 2: '失效', 3: '黑名单' };
        const rows = cookies.map(cookie => [
            cookie.id,
            cookie.ip,
            statusMap[cookie.status],
            cookie.use_count,
            this.formatTime(cookie.last_used_time),
            this.formatTime(cookie.last_check_time),
        ]);
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// 应用启动
let app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new CookieAdminApp();
    });
} else {
    app = new CookieAdminApp();
}
