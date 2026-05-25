# 盾构同步注浆系统三维交互展示平台

这是一个用于课堂汇报和工程展示的 Vite + React + TypeScript 单页网页。制作人：机电3242 赵文杰。当前程序化模型是“工程教学示意模型”，目标是做到结构真实、比例合理、施工逻辑真实，并支持后续替换真实 GLB / CAD 模型。

当前模型不代表任何具体厂家或具体型号。真正达到工程级真实效果，需要后续导入真实盾构机尾部、管片、注浆泵站和管路系统的 GLB / CAD 模型。

## 如何运行

```bash
npm install
npm run dev
```

默认开发地址为 `http://localhost:5173`。

生产构建检查：

```bash
npm run build
npm run preview
```

如需额外做 TypeScript 类型检查：

```bash
npm run typecheck
```

## 展示与交互

页面顶部提供“项目说明”“全屏展示”“重置视角”“导出当前视图”等按钮，适合课堂汇报和在线分享。

使用提示：

- 鼠标左键旋转视角；
- 滚轮缩放；
- 右键平移；
- 点击部件查看说明；
- 点击爆炸视图查看系统结构；
- 迷失视角后点击顶部“重置视角”恢复默认视角。

## 如何替换真实 GLB 模型

真实模型放在：

```text
public/models/
```

已预留文件名：

```text
public/models/shield_tail.glb
public/models/segment_ring.glb
public/models/grout_pump.glb
public/models/mixing_tank.glb
public/models/slurry_tank.glb
public/models/valve_group.glb
public/models/grout_pipeline.glb
public/models/control_cabinet.glb
```

代码中新增了 `ModelLoader`，并按部件级接入到模型组件中：

```tsx
<ModelLoader src="/models/grout_pump.glb" fallback={<ProceduralGroutPump />} />
```

如果 GLB 文件存在且不是 Vite 返回的 HTML fallback，会自动加载真实模型；如果不存在，会使用当前程序化工程示意模型作为 fallback。模型路径集中在 `src/data/modelSources.ts`。

当前已接入的部件级替换点包括：

- `shield_tail.glb`：盾尾壳体；
- `segment_ring.glb`：管片环；
- `mixing_tank.glb`：搅拌制浆罐；
- `slurry_tank.glb`：储浆罐；
- `grout_pump.glb`：注浆泵；
- `valve_group.glb`：分配阀组；
- `grout_pipeline.glb`：主管、支管与环形注浆管；
- `control_cabinet.glb`：注浆控制柜。

替换真实模型时建议保持现有部件 ID 和交互语义，例如 `shieldTail`、`segmentRing`、`groutPump`、`pipeline`、`valve`、`controlCabinet`，这样右侧说明卡、热点、教学流程和风险提示可以继续复用。

## 如何修改讲解文案

教学步骤位于：

```text
src/data/teaching.ts
```

中文语音讲解文案位于：

```text
src/data/narrationScripts.ts
```

语音功能由浏览器 Web Speech API 实现，Hook 位于：

```text
src/hooks/useNarration.ts
```

不依赖后端，不使用外部付费接口。若浏览器不支持 `speechSynthesis`，教学面板会显示“不支持语音讲解”的提示。

自动教学讲解使用 `Promise + SpeechSynthesisUtterance.onend` 控制步骤切换：当前步骤语音完整结束后，才会进入下一步。请不要再用固定 `setInterval` 或固定 `setTimeout` 强行跳步。

## 如何修改运行原理阶段

运行原理阶段位于：

```text
src/data/operationStages.ts
```

每个阶段包含：

- `start` / `end`：进度范围；
- `phase`：对应施工阶段；
- `preset`：相机视角；
- `focusParts`：高亮部件；
- `timelineStepId`：同步底部时间轴；
- `narration`：阶段语音文案。

运行演示默认使用“自动讲解”模式，每个阶段语音讲完后进入下一阶段；也可以切换为“连续播放”，让进度按时间平滑推进。

## 如何调整相机预设

相机预设位于：

```text
src/components/GroutingScene.tsx
```

修改 `cameraPresets` 中每个预设的 `position` 和 `target` 即可。

相机控制有四种模式：

- `free`：自由观察，用户完全控制 OrbitControls。
- `preset`：点击视角预设或重置视角时的一次性平滑过渡。
- `teaching`：点击教学步骤时的一次性平滑过渡。
- `tour`：运行演示中的自动视角。

注意：`cameraMode === "free"` 时，代码不会持续修改 `camera.position`、`camera.rotation` 或 `controls.target`。

## 如何调整注浆参数

默认参数和风险预设位于：

```text
src/utils/engineering.ts
```

右侧参数面板位于：

```text
src/components/ParameterPanel.tsx
```

参数会联动：

- 管路粒子流速；
- 浆液填充层连续性；
- 注浆不足空洞提示；
- 压力过大外溢 / 隆起提示；
- 仪表盘和沉降曲线。

## 部署到互联网

### Vercel 部署

推荐使用 Vercel，让别人通过公开网址直接打开网页。

1. 注册或登录 Vercel。
2. 将本项目推送到 GitHub 仓库。
3. 在 Vercel 中选择 `Add New Project`，导入该 GitHub 仓库。
4. Framework Preset 选择 `Vite`。
5. Build Command 使用 `npm run build`。
6. Output Directory 使用 `dist`。
7. 点击 `Deploy`。
8. 部署成功后复制 Vercel 生成的公开访问链接发给别人。

项目已包含 `vercel.json`，用于 Vite 单页应用路由重写，避免刷新后 404：

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Netlify 部署

也可以使用 Netlify：

1. 将项目推送到 GitHub 仓库。
2. 在 Netlify 中选择导入仓库。
3. Build command 填写 `npm run build`。
4. Publish directory 填写 `dist`。
5. 点击 Deploy。

项目已包含 `public/_redirects`：

```text
/* /index.html 200
```

这样 Netlify 部署后刷新任意路径也会回到单页应用入口。

## 静态资源路径

部署时请把模型、纹理、音频等静态资源放入 `public/`：

- 模型：`public/models/xxx.glb`，代码中使用 `/models/xxx.glb`；
- 纹理：`public/textures/xxx.png`，代码中使用 `/textures/xxx.png`；
- 音频：`public/audio/xxx.mp3`，代码中使用 `/audio/xxx.mp3`。

不要在代码中使用本机绝对路径，例如 `C:\Users\...`。后续导入大体量 GLB 时建议使用 Draco 或 Meshopt 压缩，减少首屏加载时间。

## 发布前检查清单

1. `npm install` 正常。
2. `npm run dev` 本地正常。
3. `npm run build` 构建成功。
4. `npm run preview` 预览正常。
5. 3D 模型可以自由旋转、缩放、平移。
6. 教学语音可播放、暂停、停止。
7. 爆炸视图、剖切视图、运行演示可用。
8. 手机或小屏幕下不严重遮挡。
9. 部署后 `public` 资源路径正常。
10. 复制部署链接到其他电脑或手机测试能打开。

## 程序化模型说明

当前程序化模型包含：

- 盾尾钢壳、盾尾刷、油脂密封区；
- 多环混凝土管片，含纵缝、环缝、螺栓孔、手孔和密封槽；
- 管片外侧建筑空隙和灰白半透明浆液填充层；
- 分层土体、颗粒和粗糙剖面；
- 搅拌罐、储浆罐、注浆泵、主管路、分配阀组、环形注浆管和多点注浆口；
- 压力表、流量计、控制柜、检修平台、护栏、轨道和施工泥浆区域。

这些结构用于教学和工程逻辑展示，不应作为具体设备型号或施工图使用。
