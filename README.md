# 逆光协议

一款浏览器端的前额叶反应训练小游戏。当前版本为可直接游玩的 HTML 原型，无需安装或构建。

## 在线试玩

[立即开始游戏](https://htmlpreview.github.io/?https://github.com/aryabrba-hash/niguang-protocol/blob/main/index.html)

## 当前版本

- 版本：`v0.1.0`
- 阶段：基础可玩原型
- 入口：`index.html`
- 技术：原生 HTML、CSS、JavaScript

## 本地运行

下载仓库后直接双击 `index.html`，或使用任意静态文件服务器打开项目目录。

## 项目结构

```text
.
├── index.html
├── VERSION
├── CHANGELOG.md
├── README.md
└── .github/workflows/version-tag.yml
```

## 版本管理约定

项目采用 [语义化版本](https://semver.org/lang/zh-CN/)：

- `MAJOR`：不兼容的玩法或数据结构变化
- `MINOR`：向后兼容的新玩法、新模式或重要功能
- `PATCH`：错误修复、平衡性调整和体验优化

稳定版本以 Git 标签标记，例如 `v0.1.0`。日常开发从 `main` 创建短期分支，命名为 `feature/...`、`fix/...` 或 `chore/...`，完成后合并回 `main`。

提交信息使用以下前缀：

- `feat:` 新功能
- `fix:` 错误修复
- `perf:` 性能优化
- `refactor:` 重构
- `docs:` 文档
- `chore:` 工程维护

## 发布流程

1. 在 `CHANGELOG.md` 中记录本次变化。
2. 更新 `VERSION`。
3. 合并并确认 `main` 可正常游玩。
4. 合并后由 GitHub Actions 自动创建对应的 `vX.Y.Z` 标签。
5. 验证分享链接。

## 说明

这是认知训练类娱乐产品原型，不替代医疗诊断或治疗。
