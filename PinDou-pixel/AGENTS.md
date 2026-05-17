# PinDou-pixel 项目规范

## 项目概述

- **项目名称**：PinDou-pixel（拼豆王国）
- **项目描述**：像素艺术创作平台，支持图片上传、像素化处理、拼豆颜色调色板
- **技术项目根目录**：`PinDou-pixel/`

## 技术栈

- **前端**：HTML5 + CSS3 + Vanilla JavaScript
- **无框架**：纯原生实现
- **无构建工具**：纯静态资源
- **测试脚本**：Python (Playwright)

## 目录结构

```
PinDou-pixel/
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
└── test_generator.py  # Playwright 测试脚本
```

## 关键入口

- **主入口**：`index.html`
- **颜色调色板**：`colors.html`
- **图库**：`library.html`

## 运行与预览

### 预览服务
- **端口**：5000
- **启动方式**：`bash scripts/coze-preview-run.sh`
- **验证**：`curl http://localhost:5000` 返回 HTTP 200

### 部署配置
- **deploy.kind**：service
- **deploy.flavor**：web
- **deploy.run**：使用 Python 静态服务器 (`python3 -m http.server`)

## 预览链路说明

由于项目是纯静态 HTML/CSS/JS，无 Node.js 依赖，预览和部署均使用 Python 内置 HTTP 服务器：

- `scripts/coze-preview-run.sh`：启动预览服务（5000 端口）
- `scripts/coze-deploy-run.sh`：启动部署服务（5000 端口）
- 两者均使用 `python3 -m http.server`，具有幂等性

## 用户偏好与长期约束

1. **静态文件项目**：无需 npm/pnpm 构建，直接通过 HTTP 服务器访问
2. **端口固定**：预览和部署均使用 5000 端口
3. **无需后端**：纯前端项目，数据处理在浏览器端完成
4. **Python 测试**：test_generator.py 使用 Playwright，仅用于本地测试

## 常见问题和预防

- **Q**: 预览无法启动？
  - **A**: 检查 5000 端口是否被占用：`fuser -k 5000/tcp`
  
- **Q**: 图片上传无响应？
  - **A**: 检查浏览器控制台是否有跨域错误，确认通过 HTTP 服务访问而非 file:// 协议
