# 💰 薪资计时器

一个实时计算薪资的网页应用，帮助您了解每一分钟的价值！

## ✨ 功能特性

- 🕐 **实时时间显示** - 显示当前时间和日期
- 💵 **薪资计算** - 输入月薪，实时计算每分钟薪资
- ⏱️ **计时功能** - 从开始时间计算累计获得的薪资
- 🎉 **撒花庆祝** - 每当累计薪资达到100元时自动撒花
- 📱 **响应式设计** - 完美适配移动端和桌面端
- 🎨 **现代UI** - 使用 Tailwind CSS 和 shadcn/ui 组件

## 🚀 使用方法

1. 输入您的月薪金额
2. 点击"开始计时"按钮
3. 系统开始实时计算从当前时间开始的薪资
4. 每当累计薪资达到100元时，自动触发撒花动画
5. 可以随时重新开始或测试撒花效果

## 🛠️ 技术栈

- **框架**: Next.js 15.3.4 (App Router)
- **语言**: TypeScript 5.x
- **样式**: Tailwind CSS 4.x
- **组件**: shadcn/ui
- **动画**: canvas-confetti
- **部署**: GitHub Pages

## 📦 安装和运行

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run start
```

### 部署到 GitHub Pages

1. 构建项目：`npm run build`
2. 将 `out` 目录的内容推送到 GitHub 仓库
3. 在 GitHub 仓库设置中启用 GitHub Pages
4. 选择 `out` 目录作为源目录

## 🎯 薪资计算公式

```
每分钟薪资 = 月薪 ÷ 30天 ÷ 24小时 ÷ 60分钟
累计薪资 = 每分钟薪资 × 经过的分钟数
```

## 🔧 项目结构

```
src/
├── app/
│   ├── layout.tsx      # 应用布局
│   ├── page.tsx        # 主页面
│   └── globals.css     # 全局样式
├── components/
│   └── ui/             # shadcn/ui 组件
└── lib/
    └── utils.ts        # 工具函数
```

## 📱 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License
