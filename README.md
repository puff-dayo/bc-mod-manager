# BC Mod Manager

BC Mod Manager (BMM) 是一个面向 [Bondage Club](https://www.bondageprojects.com/club_game/) 的模组管理器和加载器。它兼容现有 FUSAM manifest 格式，同时提供更强的 registry 管理、加载状态观测、缓存更新提示、BC Mod SDK 接管与崩溃诊断能力。

项目产物可通过油猴脚本、书签或控制台注入到 Bondage Club 页面中运行。运行后，BMM 会在游戏登录/偏好设置界面显示启动按钮，并在独立 Shadow DOM 中渲染管理界面，尽量减少与游戏原有样式和其他插件的冲突。

## 功能概览

- 模组管理：安装、移除、搜索、筛选、选择 stable/beta/dev 等 distribution，并显示实际加载状态。
- Registry 管理：内置多个预设 FUSAM registry，也可以添加、编辑、刷新自定义 registry。
- 自定义扩展：直接添加 `http://`、`https://` 源，用于本地开发和临时加载脚本。
- 多种加载类型：支持 classic script、ES module 和 eval/global-scope 执行。
- 加载进度窗口：展示 pending/loading/loaded/error、耗时、失败原因，并在启动期间提示旧版本缓存。
- 模组缓存：可使用浏览器 HTTP 缓存加速启动，并通过内容 hash 检测更新；也可在设置中关闭缓存。
- FUSAM 兼容层：暴露 `window.FUSAM.present`、`window.FUSAM.addons`、`registerDebugMethod` 和 modal API，兼容依赖 FUSAM 环境的插件。
- 崩溃诊断：捕获 Mod SDK hook/patch 崩溃，展示调用栈、相关 mod、已加载 mod，并支持上传/复制 crash report。
- 日志查看器：内置日志面板，支持等级筛选、搜索、自动刷新、下载调试报告。
- 多语言：当前包含 EN、CN、TW、DE、FR、RU、UA 翻译资源。

## 相比 FUSAM 的优势

FUSAM 是 Bondage Club 社区中非常重要的现有插件加载器，许多插件文档都会推荐通过 FUSAM 安装。BMM 的目标不是破坏这个生态，而是在兼容 FUSAM manifest 和部分运行时 API 的前提下，补上更适合复杂模组组合和开发调试的能力。

| 能力 | FUSAM | BC Mod Manager |
| --- | --- | --- |
| Manifest 生态 | 使用 FUSAM addon manifest | 直接兼容 FUSAM manifest，并支持多个 registry 并存 |
| 自定义来源 | 支持通过 `?fusam=` 指向开发源 | 在 UI 中长期保存自定义扩展，支持 `file://` 本地脚本 |
| 加载可观测性 | 主要关注启用/禁用 | 显示每个模组的 pending/loading/loaded/error、耗时和错误详情 |
| 加载时机 | FUSAM 已知存在异步加载点难以控制的问题 | BMM 等待 BC 运行态可用后统一加载，并在 UI 中暴露等待和加载过程 |
| 更新缓存 | 传统 URL/浏览器缓存行为 | 对加载器和每个模组按内容 hash 建立 pin，后台检测更新并提示刷新 |
| 调试工具 | 插件可注册调试方法 | 日志查看器集中展示系统信息、registry、mod 配置和 loader 状态 |

这些差异对以下场景特别有用：

- 同时启用多个大型 BC 插件，需要知道到底哪个插件加载失败或初始化报错。
- 插件作者在本地开发，需要稳定保存本地/测试脚本入口。
- 玩家希望减少重复网络请求，但又希望知道缓存中的模组是否已经过期。
- 需要兼容依赖 `window.FUSAM` 的现有插件，同时逐步迁移到更强的加载与诊断体验。

## 安装

项目的 GitHub Pages 页面提供三种注入方式：

<https://bondage-studio.github.io/bc-mod-manager/>

推荐使用油猴脚本：

<https://bondage-studio.github.io/bc-mod-manager/bmm.user.js>

油猴脚本会在以下 Bondage Club 域名上于 `document-start` 自动运行：

- `bondageprojects.elementfx.com`
- `bondage-europe.com`
- `bondage-asia.com`

也可以使用书签或控制台临时注入：

```js
(_ => {
  const script = document.createElement("script");
  script.src = "https://bondage-studio.github.io/bc-mod-manager/main.js";
  document.head.appendChild(script);
})()
```

## 使用

1. 安装油猴脚本或使用书签/控制台注入。
2. 打开 Bondage Club。
3. 在登录页或偏好设置页点击 `BC Mod Manager` 悬浮按钮。
4. 在 `注册表管理器` 中刷新预设 registry，或添加自己的 registry。
5. 在 `模组管理器` 中搜索、安装、选择版本并启用模组。
6. 刷新页面，让启用状态和版本选择在新的游戏会话中生效。

移除已经加载的模组后，BMM 会在关闭模组管理器时刷新页面。原因是大多数 BC 模组执行后无法被完全卸载，仅移除 `<script>` 标签并不能撤销其对游戏运行时的修改。

## Registry 格式

当前主要支持 FUSAM manifest 格式：

```json
{
  "version": "1",
  "addons": [
    {
      "id": "example-mod",
      "name": "Example Mod",
      "description": "Short description",
      "author": "Author",
      "repository": "https://github.com/example/example-mod",
      "tags": ["enhancements"],
      "type": "script",
      "versions": [
        {
          "distribution": "stable",
          "source": "https://example.com/mod.js"
        },
        {
          "distribution": "beta",
          "source": "https://example.com/mod.beta.js"
        }
      ]
    }
  ]
}
```

字段说明：

- `id`：registry 内唯一 ID。
- `name`：字符串，或按语言拆分的对象。
- `description`、`author`：展示用元数据。
- `repository`、`website`、`discord`、`icon`、`tags`：可选展示字段。
- `type`：`script`、`module` 或 `eval`，缺省时按 `script` 加载。
- `versions`：可选 distribution 列表，每项提供一个可加载的 `source`。
- `noCacheBusting`：设为 `true` 后，BMM 会原样加载 URL，不追加 hash/session 参数。

`aurora` registry 类型目前仅保留类型入口，解析结构仍是 TODO。

## 开发

环境要求：

- Node.js 22 或兼容版本
- Git submodule 已初始化

初始化：

```sh
git submodule update --init
npm install
```

开发服务器：

```sh
npm run dev
```

构建：

```sh
npm run build
```

预览构建产物：

```sh
npm run preview
```

## 构建与部署

仓库包含 GitHub Pages workflow：推送到 `main` 后会使用 Node.js 22 执行 `npm install` 和 `npm run build`，然后将 `dist/` 部署到 Pages。

Vite 构建配置会：

- 使用 Preact 和 Tailwind CSS。
- 将 CSS 注入 BMM 的 Shadow DOM。
- 将入口脚本打包为 `main.js`。
- 从上游 SDK `package.json` 读取版本并注入 `VERSION`。

## 说明

Bondage Club、FUSAM 和各个第三方模组属于其各自作者和社区。BMM 是一个独立的社区工具，加载第三方模组前请自行确认来源可信，并理解第三方脚本会在游戏页面中执行。
