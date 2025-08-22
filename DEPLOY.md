# 🚀 部署到 GitHub Pages 指南

## 自动部署（推荐）

### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "Initial commit: 薪资计时器应用"
git push origin main
```

### 2. 配置 GitHub Pages

1. 进入 GitHub 仓库设置
2. 找到 "Pages" 选项
3. 在 "Source" 中选择 "GitHub Actions"
4. 保存设置

### 3. 自动部署

每次推送到 `main` 分支时，GitHub Actions 会自动：
- 安装依赖
- 构建项目
- 部署到 GitHub Pages

## 手动部署

### 1. 构建项目

```bash
npm run build
```

### 2. 部署到 GitHub Pages

```bash
# 创建 gh-pages 分支
git checkout -b gh-pages

# 删除所有文件（除了 out 目录）
git rm -rf .

# 将 out 目录内容移动到根目录
mv out/* .
rmdir out

# 提交更改
git add .
git commit -m "Deploy to GitHub Pages"

# 推送到远程仓库
git push origin gh-pages

# 切换回 main 分支
git checkout main
```

### 3. 配置 GitHub Pages 源

在 GitHub 仓库设置中：
- 选择 "Source" 为 "Deploy from a branch"
- 选择 "gh-pages" 分支
- 选择根目录 "/ (root)"

## 注意事项

1. **basePath 配置**: 如果仓库名不是 `aiwow`，请修改 `next.config.ts` 中的 `basePath`
2. **CNAME**: 如果需要自定义域名，在 `public` 目录下创建 `CNAME` 文件
3. **404 页面**: 静态导出模式下，需要配置 404 页面重定向

## 故障排除

### 构建失败
- 检查 Node.js 版本（推荐 18+）
- 确保所有依赖已安装
- 检查 TypeScript 类型错误

### 部署后页面空白
- 检查 `basePath` 配置
- 确认 GitHub Pages 源设置正确
- 查看浏览器控制台错误信息

### 撒花动画不工作
- 确认 `canvas-confetti` 依赖已安装
- 检查浏览器是否支持 Canvas API
- 查看控制台是否有 JavaScript 错误

## 性能优化

1. **代码分割**: Next.js 自动处理
2. **图片优化**: 使用 `next/image` 组件
3. **字体优化**: 使用 `next/font` 优化字体加载
4. **缓存策略**: 配置适当的缓存头

## 监控和分析

- 使用 GitHub Actions 监控部署状态
- 配置错误监控服务
- 添加用户行为分析
