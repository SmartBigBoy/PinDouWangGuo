# PinDou-pixel 项目规范

## 项目概述

- **项目名称**：PinDou-pixel（拼豆王国）
- **项目描述**：像素艺术创作平台，支持图片上传、像素化处理、拼豆颜色调色板
- **部署域名**：https://pindou.skin
- **GitHub 仓库**：https://github.com/SmartBigBoy/PinDouWangGuo

## 技术栈

- **前端**：HTML5 + CSS3 + Vanilla JavaScript
- **无框架**：纯原生实现
- **无构建工具**：纯静态资源

## 目录结构

```
/
├── index.html      # 主入口页面
├── style.css       # 样式文件
├── script.js       # 主要交互逻辑
├── colors.html     # 颜色调色板页面
├── colors.js       # 颜色调色板逻辑
├── materials.html  # 材料页面
├── library.html    # 图库页面
├── about.html      # 关于页面
├── logo.svg        # Logo
├── images/         # 静态图片资源
│   └── library/    # 角色图片库
└── CNAME           # GitHub Pages 自定义域名
```

## 部署说明

- **平台**：GitHub Pages
- **Source**：main 分支，/ (root) 目录
- **域名**：pindou.skin
- **HTTPS**：已启用

## 用户偏好与约束

1. **静态文件项目**：无需构建，直接通过 HTTP 服务器访问
2. **端口固定**：预览和部署均使用 5000 端口
3. **git push 确认**：所有推送到 GitHub 前需用户同意

## 预览服务

- **端口**：5000
- **启动**：`bash scripts/coze-preview-run.sh`
- **验证**：`curl http://localhost:5000` 返回 HTTP 200
