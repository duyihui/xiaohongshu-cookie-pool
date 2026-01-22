/**
 * 主应用程序
 */

class CookieAdminApp {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.charts = {};
        this.selectedCookies = new Set();
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        this.setupEventListeners();
        await this.loadDashboard();
        await this.checkServerStatus();
        this.setupAutoRefresh();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 标签页切换
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e));
        });

        // Dashboard
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadDashboard());

        // Cookie列表
        document.getElementById('searchBtn').addEventListener('click', () => this.loadCookies());
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
         const editCloseBtn = editModal.querySelector('.close-btn');
         const editCancelBtn = document.getElementById('editCancelBtn');
         const editSaveBtn = document.getElementById('editSaveBtn');

         editCloseBtn.addEventListener('click', () => {
             this.closeEditModal();
         });

         editCancelBtn.addEventListener('click', () => {
             this.closeEditModal();
         });

         editSaveBtn.addEventListener('click', () => {
             this.saveCookie();
         });

          // 点击模态框外部区域关闭 (可选)
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
                  }
              }
          });
      }

    /**
     * 标签页切换
     */
    switchTab(e) {
        e.preventDefault();
        const tab = e.currentTarget.getAttribute('data-tab');

        // 更新nav-item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        e.currentTarget.classList.add('active');

        // 更新内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tab).classList.add('active');

        // 加载对应数据
        if (tab === 'dashboard') {
            this.loadDashboard();
        } else if (tab === 'cookies') {
            this.loadCookies();
        }
    }

    /**
     * 加载仪表板数据
     */
    async loadDashboard() {
        try {
            const data = await api.getStatistics();
            if (data && data.code === 200 && data.data) {
                const stats = data.data;
                
                // 验证并转换数据类型
                const totalCookies = parseInt(stats.total) || 0;
                const availableCookies = parseInt(stats.available) || 0;
                const usingCookies = parseInt(stats.using) || 0;
                const invalidCookies = parseInt(stats.invalid) || 0;
                const blacklistCookies = parseInt(stats.blacklist) || 0;
                const avgUseCount = parseFloat(stats.avgUseCount) || 0;

                // 更新DOM元素
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
                    } else {
                        console.warn(`Element with id "${id}" not found`);
                    }
                }

                // 更新图表（传递转换后的数据）
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

     /**
      * 更新图表
      */
     updateCharts(stats) {
         try {
             // 检查Chart.js是否加载
             if (typeof Chart === 'undefined') {
                 console.error('Chart.js is not loaded');
                 this.showNotification('图表库未加载，请刷新页面', 'error');
                 return;
             }

             // 确保数据是数字类型
             const data = {
                 total: parseInt(stats.total) || 0,
                 available: parseInt(stats.available) || 0,
                 using: parseInt(stats.using) || 0,
                 invalid: parseInt(stats.invalid) || 0,
                 blacklist: parseInt(stats.blacklist) || 0,
             };

             console.log('Updating charts with data:', data);

             // 状态分布图
             const statusCtx = document.getElementById('statusChart');
             if (!statusCtx) {
                 console.error('statusChart canvas element not found');
                 this.showNotification('图表元素未找到，请刷新页面', 'error');
                 return;
             }

             if (this.charts.statusChart) {
                 this.charts.statusChart.destroy();
             }

             console.log('Creating statusChart...');
             this.charts.statusChart = new Chart(statusCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['可用', '使用中', '失效', '黑名单'],
                    datasets: [{
                        data: [data.available, data.using, data.invalid, data.blacklist],
                        backgroundColor: [
                            '#52c41a',
                            '#1890ff',
                            '#f5222d',
                            '#722ed1',
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                    },
                },
            });

             // 使用频率图（简单直方图）
             const usageCtx = document.getElementById('usageChart');
             if (!usageCtx) {
                 console.error('usageChart canvas element not found');
                 this.showNotification('图表元素未找到，请刷新页面', 'error');
                 return;
             }

             if (this.charts.usageChart) {
                 this.charts.usageChart.destroy();
             }

             console.log('Creating usageChart...');
             this.charts.usageChart = new Chart(usageCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['总数', '可用', '使用中', '失效', '黑名单'],
                    datasets: [{
                        label: '数量',
                        data: [data.total, data.available, data.using, data.invalid, data.blacklist],
                        backgroundColor: '#667eea',
                        borderRadius: 4,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                        },
                    },
                },
            });
        } catch (error) {
            console.error('Error updating charts:', error);
            this.showNotification('图表加载失败，请刷新页面', 'error');
        }
    }

    /**
     * 加载Cookie列表
     */
    async loadCookies() {
        try {
            const ip = document.getElementById('searchIP').value;
            const status = document.getElementById('statusFilter').value;

            const data = await api.getCookies(this.currentPage, this.pageSize, status, ip);
            if (data.code === 200) {
                this.renderCookieTable(data.data.data);
                this.updatePagination(data.data.pagination);
            }
        } catch (error) {
            this.showNotification('加载Cookie列表失败', 'error');
            console.error(error);
        }
    }

    /**
     * 渲染Cookie表格
     */
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

        tbody.innerHTML = cookies.map(cookie => `
            <tr>
                <td><input type="checkbox" class="table-checkbox" value="${cookie.id}"></td>
                <td>${cookie.id}</td>
                <td>${cookie.ip}</td>
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
            </tr>
        `).join('');

        // 绑定复选框事件
        document.querySelectorAll('.table-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectAll());
        });
    }

    /**
     * 更新分页
     */
    updatePagination(pagination) {
        document.getElementById('pageInfo').textContent = `第 ${pagination.page} / ${pagination.totalPages} 页`;
        document.getElementById('prevPage').disabled = pagination.page <= 1;
        document.getElementById('nextPage').disabled = pagination.page >= pagination.totalPages;
    }

    /**
     * 显示Cookie详情
     */
    async showDetail(id) {
        try {
            const data = await api.getCookieDetail(id);
            if (data.code === 200) {
                const cookie = data.data;
                const modalBody = document.getElementById('modalBody');
                const statusMap = {
                    0: '可用',
                    1: '使用中',
                    2: '失效',
                    3: '黑名单',
                };

                modalBody.innerHTML = `
                    <div style="line-height: 2;">
                        <p><strong>ID:</strong> ${cookie.id}</p>
                        <p><strong>IP:</strong> ${cookie.ip}</p>
                        <p><strong>状态:</strong> ${statusMap[cookie.status]}</p>
                        <p><strong>使用次数:</strong> ${cookie.use_count}</p>
                        <p><strong>最后使用:</strong> ${this.formatTime(cookie.last_used_time)}</p>
                        <p><strong>最后检测:</strong> ${this.formatTime(cookie.last_check_time)}</p>
                        <p><strong>有效期至:</strong> ${this.formatTime(cookie.valid_until)}</p>
                        <p><strong>Cookie:</strong> <code style="background: #f5f5f5; padding: 4px; border-radius: 2px; word-break: break-all;">${cookie.cookie}</code></p>
                        ${cookie.error_msg ? `<p style="color: #f5222d;"><strong>错误:</strong> ${cookie.error_msg}</p>` : ''}
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

    /**
     * 验证单个Cookie
     */
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

    /**
     * 添加单个Cookie到黑名单
     */
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

     /**
      * 编辑Cookie - 打开编辑模态框
      */
     async editCookie(id) {
         try {
             const data = await api.getCookieDetail(id);
             if (data.code === 200) {
                 const cookie = data.data;
                 // 填充表单字段
                 document.getElementById('editId').value = cookie.id;
                 document.getElementById('editIp').value = cookie.ip;
                 document.getElementById('editCookie').value = cookie.cookie;
                 
                 // 格式化时间为datetime-local格式 (YYYY-MM-DDTHH:mm)
                 if (cookie.valid_until) {
                     const date = new Date(cookie.valid_until);
                     const localDatetime = date.toISOString().slice(0, 16);
                     document.getElementById('editValidUntil').value = localDatetime;
                 }
                 
                 document.getElementById('editStatus').value = cookie.status;
                 
                 // 显示模态框
                 const modal = document.getElementById('editModal');
                 modal.style.display = 'flex';
                 this.currentEditingId = id;
             }
         } catch (error) {
             this.showNotification('获取Cookie详情失败', 'error');
             console.error(error);
         }
     }

     /**
      * 保存编辑的Cookie
      */
     async saveCookie() {
         const id = document.getElementById('editId').value;
         const ip = document.getElementById('editIp').value;
         const cookie = document.getElementById('editCookie').value;
         const validUntil = document.getElementById('editValidUntil').value;
         const status = document.getElementById('editStatus').value;

         // 验证必填字段
         if (!ip || !cookie) {
             this.showNotification('请填写IP地址和Cookie值', 'error');
             return;
         }

         try {
             // 转换datetime-local为ISO字符串
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

     /**
      * 删除单个Cookie
      */
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

     /**
      * 释放单个Cookie
      */
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

     /**
      * 关闭编辑模态框
      */
     closeEditModal() {
         const modal = document.getElementById('editModal');
         modal.style.display = 'none';
         this.currentEditingId = null;
     }

     /**
      * 切换导入方式
      */
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

    /**
     * 处理文件选择
     */
    handleFileSelected() {
        const file = document.getElementById('fileInput').files[0];
        if (!file) return;

        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileInfo').style.display = 'block';
    }

    /**
     * 导入Cookie
     */
    async importCookies() {
        const method = document.querySelector('.method-tab.active').getAttribute('data-method');
        let cookieLines = [];

        if (method === 'textarea') {
            cookieLines = document.getElementById('cookieInput').value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
        } else {
            // 文件导入逻辑
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

    /**
     * 清除导入表单
     */
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

    /**
     * 批量验证
     */
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

    /**
     * 批量添加黑名单
     */
    async batchBlacklist() {
        const ids = this.parseBatchInput();
        if (ids.length === 0) {
            this.showNotification('请输入Cookie ID', 'warning');
            return;
        }

        this.showConfirm('确认操作', `确定要添加${ids.length}条Cookie到黑名单吗?`, async () => {
            try {
                // 这里需要后端支持批量黑名单操作
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

    /**
     * 批量释放
     */
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

    /**
     * 批量删除（添加到黑名单）
     */
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

    /**
     * 解析批量输入
     */
    parseBatchInput() {
        const input = document.getElementById('batchInput').value.trim();
        if (!input) return [];

        return input.split(/[,\n\s]+/).filter(id => id && !isNaN(id)).map(id => parseInt(id));
    }

    /**
     * 更新批量操作预览
     */
    updateBatchPreview() {
        const ids = this.parseBatchInput();
        const preview = document.getElementById('batchPreview');

        if (ids.length === 0) {
            preview.innerHTML = '<p class="text-muted">选择操作后显示预览...</p>';
        } else {
            preview.innerHTML = `
                <p><strong>已选择${ids.length}条Cookie:</strong></p>
                <p style="word-break: break-all; font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 4px;">
                    ${ids.join(', ')}
                </p>
            `;
        }
    }

    /**
     * 显示批量操作结果
     */
    showBatchResults(results) {
        const resultsDiv = document.getElementById('batchResults');
        const resultsList = document.getElementById('batchResultsList');

        resultsList.innerHTML = results.map(result => `
            <div class="result-item ${result.valid ? 'result-success' : 'result-error'}">
                <strong>ID: ${result.id}</strong> - ${result.ip}
                <p>${result.valid ? '✓ 有效' : '✗ 无效'}</p>
            </div>
        `).join('');

        resultsDiv.style.display = 'block';
    }

    /**
     * 导出为CSV
     */
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

    /**
     * 导出为JSON
     */
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

    /**
     * 清理失效Cookie
     */
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

    /**
     * 清空黑名单
     */
    cleanBlacklist() {
        this.showConfirm('确认操作', '确定要清空黑名单吗?', async () => {
            try {
                const data = await api.getCookies(1, 999999, '3');
                if (data.code === 200) {
                    const count = data.data.data.length;
                    // 这里需要后端支持删除操作
                    this.showNotification(`黑名单中有${count}条Cookie`, 'info');
                }
            } catch (error) {
                this.showNotification('操作失败', 'error');
                console.error(error);
            }
        });
    }

    /**
     * 全选/取消全选
     */
    selectAllCookies(e) {
        document.querySelectorAll('.table-checkbox').forEach(checkbox => {
            if (checkbox.id !== 'selectAll') {
                checkbox.checked = e.currentTarget.checked;
            }
        });
    }

    /**
     * 更新全选状态
     */
    updateSelectAll() {
        const checkboxes = document.querySelectorAll('.table-checkbox:not(#selectAll)');
        const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
        document.getElementById('selectAll').checked = checked === checkboxes.length && checkboxes.length > 0;
    }

    /**
     * 检查服务器状态
     */
    async checkServerStatus() {
        try {
            await api.healthCheck();
            document.getElementById('serverStatus').style.color = '#52c41a';
            document.getElementById('apiUrl').value = '/api';
            document.getElementById('serverInfo').value = '在线';
        } catch (error) {
            document.getElementById('serverStatus').style.color = '#f5222d';
            document.getElementById('serverInfo').value = '离线';
        }
    }

    /**
     * 设置自动刷新
     */
    setupAutoRefresh() {
        // 每30秒刷新一次仪表板
        setInterval(() => {
            if (document.getElementById('dashboard').classList.contains('active')) {
                this.loadDashboard();
            }
        }, 30000);
    }

    /**
     * 显示通知
     */
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
                <div class="notify-message">${message}</div>
            </div>
        `;

        notification.appendChild(notify);
        setTimeout(() => {
            notify.remove();
        }, 3000);
    }

    /**
     * 显示确认对话框
     */
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

    /**
     * 格式化时间
     */
    formatTime(time) {
        if (!time) return '-';
        const date = new Date(time);
        return date.toLocaleString('zh-CN');
    }

    /**
     * 生成CSV
     */
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

    /**
     * 下载文件
     */
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

// 应用启动 - 等待DOM完全加载
let app; // 声明为全局变量

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new CookieAdminApp();
    });
} else {
    app = new CookieAdminApp();
}
