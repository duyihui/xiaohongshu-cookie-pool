#!/bin/bash
# 快速发布到GitHub脚本
# 用法: 按照以下步骤复制粘贴命令执行

echo "╔════════════════════════════════════════════════════════╗"
echo "║    小红书Cookie池系统 - GitHub发布快速指南            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# 步骤1: 准备工作
# ============================================================
echo "【步骤1】准备工作"
echo "────────────────────────────────────────────────────────"
echo ""
echo "1️⃣ 确保已安装Git:"
echo "   git --version"
echo ""
echo "2️⃣ 进入项目目录:"
echo "   cd D:\爬虫\opencode\xiaohongshu-cookie-pool"
echo ""
echo "3️⃣ 配置Git用户信息 (首次使用):"
echo "   git config --global user.name '你的GitHub用户名'"
echo "   git config --global user.email '你的邮箱@example.com'"
echo ""

# ============================================================
# 步骤2: 初始化Git仓库
# ============================================================
echo ""
echo "【步骤2】初始化Git仓库"
echo "────────────────────────────────────────────────────────"
echo ""
echo "复制以下命令执行:"
echo ""
echo "cd D:\爬虫\opencode\xiaohongshu-cookie-pool"
echo "git init"
echo "git add ."
echo "git commit -m 'Initial commit: 小红书Cookie池管理系统 v1.1.0'"
echo ""

# ============================================================
# 步骤3: 创建GitHub仓库
# ============================================================
echo ""
echo "【步骤3】创建GitHub仓库"
echo "────────────────────────────────────────────────────────"
echo ""
echo "1️⃣ 打开 https://github.com/new"
echo ""
echo "2️⃣ 填写信息:"
echo "   Repository name: xiaohongshu-cookie-pool"
echo "   Description: 小红书Cookie池管理系统"
echo "   Public: ✓ 选中"
echo "   Initialize repository: ❌ 不选"
echo ""
echo "3️⃣ 点击 'Create repository'"
echo ""

# ============================================================
# 步骤4: 连接并推送
# ============================================================
echo ""
echo "【步骤4】连接远程仓库并推送代码"
echo "────────────────────────────────────────────────────────"
echo ""
echo "复制GitHub仓库页面给出的命令（选择SSH或HTTPS）:"
echo ""
echo "SSH方式 (推荐):"
echo "  git remote add origin git@github.com:你的用户名/xiaohongshu-cookie-pool.git"
echo "  git branch -M main"
echo "  git push -u origin main"
echo ""
echo "或 HTTPS方式:"
echo "  git remote add origin https://github.com/你的用户名/xiaohongshu-cookie-pool.git"
echo "  git branch -M main"
echo "  git push -u origin main"
echo ""

# ============================================================
# 步骤5: 验证
# ============================================================
echo ""
echo "【步骤5】验证发布成功"
echo "────────────────────────────────────────────────────────"
echo ""
echo "打开以下链接验证:"
echo "  https://github.com/你的用户名/xiaohongshu-cookie-pool"
echo ""
echo "应该能看到所有的项目文件"
echo ""
