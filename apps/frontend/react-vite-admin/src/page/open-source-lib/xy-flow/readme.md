## 主要属性分类

### 基础数据

- **`nodes`**: 节点数组，格式 `{ id, position, data, type }`。
- **`edges`**: 边数组，格式 `{ id, source, target, label, type }`。

### 状态更新回调

- **`onNodesChange`**: 节点变化时触发（拖拽位置、选中、删除等）。
- **`onEdgesChange`**: 边变化时触发（新增、删除、选中等）。
- **`onConnect`**: 连线时触发，参数 `{ source, target }`。
- **`onInit`**: ReactFlow 初始化时调用，返回实例对象（可用于调用 `zoomIn`, `fitView` 等）。

### 交互控制

- **`fitView`**: 是否在加载时自动缩放到合适的视图。
- **`fitViewOptions`**: 控制 `fitView` 的缩放参数（padding、minZoom 等）。
- **`nodesDraggable`**: 节点是否可拖拽。
- **`nodesConnectable`**: 节点是否允许连接。
- **`elementsSelectable`**: 是否允许选中节点/边。
- **`panOnDrag`**: 是否允许拖动画布。
- **`zoomOnScroll`**: 滚轮缩放。
- **`zoomOnPinch`**: 双指缩放（移动端）。
- **`zoomOnDoubleClick`**: 双击缩放。
- **`preventScrolling`**: 是否阻止浏览器默认滚动行为。

### 样式相关

- **`defaultEdgeOptions`**: 设置所有边的默认样式（比如 type, animated, markerEnd）。
- **`nodeTypes`**: 自定义节点类型，`{ typeName: Component }`。
- **`edgeTypes`**: 自定义边类型。
- **`connectionLineType`**: 新建连接线的样式（直线/曲线）。
- **`connectionLineStyle`**: 连接线的样式对象（CSS in JS）。

### 事件回调

- **`onNodeClick`**: 点击节点时触发。
- **`onNodeDoubleClick`**: 双击节点时触发。
- **`onNodeDragStart` / `onNodeDrag` / `onNodeDragStop`**: 节点拖拽生命周期事件。
- **`onEdgeClick`**: 点击边时触发。
- **`onSelectionChange`**: 选中节点或边时触发。
- **`onPaneClick`**: 点击画布空白处时触发。
- **`onPaneScroll`**: 滚动画布时触发。
- **`onMove`**: 画布视图移动时触发（缩放、拖拽）。
- **`onMoveStart` / `onMoveEnd`**: 移动画布开始 / 结束。

### 高级配置

- **`snapToGrid`**: 是否启用网格吸附。
- **`snapGrid`**: 吸附网格的间距 `[x, y]`。
- **`onlyRenderVisibleElements`**: 只渲染可见区域的节点，提升性能。
- **`minZoom` / `maxZoom`**: 缩放范围。
- **`proOptions`**: 付费 Pro 版功能开关。
- **`deleteKeyCode`**: 自定义删除键（默认 Backspace/Del）。
- **`multiSelectionKeyCode`**: 自定义多选快捷键（默认 Shift）

## Node

React Flow 自带了几个最常用的 type：

- **`input`**： 输入节点（常用于流程起点，带一个小箭头口）。
- **`output`**： 输出节点（常用于流程终点，带一个小箭头口）。
- **`default`**：默认节点（矩形，最常见）。
- **`group`**：分组节点（可以包裹其他节点，做分组管理）。

### 属性

| 属性          | 作用                 | 默认值   | 示例                                 |
| ------------- | -------------------- | -------- | ------------------------------------ |
| `selected`    | 节点是否处于选中状态 | `false`  | `{ selected: true }` 高亮节点        |
| `dragging`    | 节点是否正在被拖拽   | 自动控制 | 内部状态，一般不用手动设置           |
| `draggable`   | 节点能否被拖拽       | `true`   | `{ draggable: false }` 锁定节点      |
| `selectable`  | 节点能否被选中       | `true`   | `{ selectable: false }` 点击不会高亮 |
| `connectable` | 节点能否连线         | `true`   | `{ connectable: false }` 禁止连接    |
| `deletable`   | 节点能否删除         | `true`   | `{ deletable: false }` 保护节点      |
| `resizing`    | 节点是否正在调整大小 | 自动控制 | 需配合自定义 resize 组件             |
| `focusable`   | 节点能否获得焦点     | `true`   | `{ focusable: false }` 禁止键盘交互  |

### onNodesChange

当 节点数组 (`nodes`) 发生变化 时触发。具体包括：

1. 拖动节点（位置发生变化）。
2. 选中/取消选中节点。
3. 节点被删除。
   - 选中节点，按 Delete 或 Backspace 键，会触发删除
   - 删除一个节点，与它相连的边会自动一并删除：删除时会调用 `onNodesChange` 或 `onEdgesChange`，传入 `type: "remove"` 的 change 对象
   - 两种禁用默认删除行为的方式
     1. deleteKeyCode设置为null，推荐
     2. onNodesChange回调处理，删除节点时还要处理 onEdgesChange 回调，较麻烦
4. 节点被添加（比如通过 `setNodes` 或 `onDrop`）。
5. 节点 data 改变（通过 `updateNodeInternals` 或者 ReactFlow 内部更新）。

函数签名：`onNodesChange?: (changes: NodeChange[]) => void`

**参数 `changes`** 是一个数组，里面的每一项描述了节点的变化，一个 `NodeChange` 至少包含两个字段

- `id: string`： 哪个节点发生了变化。
- `type: string`：变化的类型。

常见的 `type` 有：

| type         | 说明                               | 额外字段                                |
| ------------ | ---------------------------------- | --------------------------------------- |
| `position`   | 节点位置改变（拖动时）             | `position: {x, y}`，`dragging: boolean` |
| `dimensions` | 节点尺寸变化（自定义节点可能触发） | `dimensions: {width, height}`           |
| `select`     | 节点被选中/取消选中                | `selected: boolean`                     |
| `remove`     | 节点被删除                         | 无                                      |
| `add`        | 节点新增                           | `item: Node`（完整节点数据）            |
| `reset`      | 节点状态被重置                     | 无                                      |

## Edge

React Flow 自带了几个最常用的 type：

| type                       | 自定义函数            | 描述                                                              |
| -------------------------- | --------------------- | ----------------------------------------------------------------- |
| **`default`**              | `getSimpleBezierPath` | 默认直线，简单线条，没有箭头（如果 markerEnd 配置了箭头，会显示） |
| **`straight`**             | `getStraightPath`     | 直线，类似 default，但更明确是直线（不经过贝塞尔曲线）            |
| **`step`**                 |                       | 折线（水平/垂直分段），有明显“折角”，常用于流程图                 |
| **`smoothstep`**           | `getSmoothStepPath`   | 平滑折线，折角圆滑，过渡自然，常用于审批流程                      |
| **`simplebezier`**         | `getBezierPath`       | 贝塞尔曲线，简单曲线，适合节点不规则布局                          |
| **`default` + `animated`** |                       | 在任何边类型基础上，加上 `animated: true` 可以显示流动动画效果    |

### 连接规则

两个节点连接时，默认遵循以下规则：

| from                | to     | 是否允许 | 原因 |
| ------------------- | ------ | -------- | ---- |
| **source → target** | ✔️允许 | 类型不同 |      |
| **target → source** | ✔️允许 | 类型不同 |      |
| **source → source** | ❌禁止 | 源码限制 |      |
| **target → target** | ❌禁止 | 源码限制 |      |
