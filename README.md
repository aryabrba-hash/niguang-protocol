# 逆光协议

一款渐进式规则切换与干扰抑制训练小游戏。当前 `v0.4.0` 是可直接发布的 Web 候选版，并已为后续微信小游戏迁移拆分核心玩法与平台能力。

## 在线试玩

[立即开始游戏](https://aryabrba-hash.github.io/niguang-protocol/?v=0.4.0)

## 这版包含什么

- 8 个由“单一规则 → 规则冲突 → 规则切换 → 干扰抑制”逐步推进的关卡
- 3 步新手引导、透明自适应难度、固定题序的每日协议
- 连击倍率、超载状态、粒子/音效/触感反馈，以及明确的断连反馈
- 本机训练趋势、成绩分享、持久化无障碍设置与安全后台暂停
- 弱机效果降级、离线缓存、版本化存档迁移和 512KB 核心包预算
- 纯函数玩法核心、浏览器与微信平台适配层、自动化测试与发布检查

## 本地运行

项目不需要安装依赖。用任意静态文件服务器打开目录，例如：

```bash
python3 -m http.server 8765
```

然后访问 `http://127.0.0.1:8765/`。如已安装 Node.js 20 或更新版本，可运行：

```bash
npm run check
```

## 项目结构

```text
.
├── index.html                 # Web 入口与可访问结构
├── styles.css                 # 响应式视觉系统
├── manifest.webmanifest       # 可安装 Web 应用
├── sw.js                      # 离线缓存与更新策略
├── src/
│   ├── core/                  # 跨平台玩法、存档、难度、统计
│   ├── platform/              # Browser / WeChat 能力适配
│   └── ui/                    # 浏览器反馈特效
├── tests/                     # 核心行为回归测试
├── scripts/validate-build.mjs # 包体、资源与版本检查
└── docs/                      # 微信迁移与产品指标
```

微信小游戏迁移步骤见 [docs/WECHAT_MINIGAME_PORT.md](docs/WECHAT_MINIGAME_PORT.md)，首发指标见 [docs/PRODUCT_METRICS.md](docs/PRODUCT_METRICS.md)。

## 版本管理

项目采用语义化版本。开发使用 `feature/...`、`fix/...`、`chore/...` 短期分支，每一轮有效改进独立提交；拉取请求必须通过逻辑测试与静态发布检查，合并到 `main` 后自动创建 `vX.Y.Z` 标签。

这是认知训练类娱乐产品，不替代医疗诊断或治疗。
