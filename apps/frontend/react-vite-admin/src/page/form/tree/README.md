# 树形动态表单

节点配置决定控件，表单值按节点 ID 保存。数组下标只表示显示顺序，不参与字段命名。
首次生成全部 19 种控件及有效默认值；顶部选择类型后，可以添加根节点或子节点，也可以随机添加。

表格第一列显示 TanStack 自动生成的行 ID，例如 `0`、`0.0`、`1`，不再自定义 getRowId。
这些行 ID 在当前表格中唯一，但增删前面的节点后会重新编号。表单内部使用 `node_1`、`node_2` 等简单递增键，保证节点值和错误归属稳定。

## 文件职责

- `schema.ts`：控件配置、值协议、字段校验和整树 Zod 校验。
- `resolver.ts`：建立节点索引，编辑时按字段校验，提交时校验完整树。
- `tool.ts`：默认值工厂、保留未变化分支引用的树操作、提交数据组合。
- `use-tree-action.ts`：协调树增删与 RHF 字段状态，保持操作回调引用稳定。
- `editable-cell.tsx`：选择受控/非受控子组件，不条件调用 Hooks。
- `field-feedback.tsx`：只订阅当前字段错误，统一呈现错误和无障碍关联。
- `editors/uncontrolled-editor.tsx`：普通输入通过 register 接入，不订阅字段值。
- `editors/` 中其他文件：复杂组件通过 useController 适配。
- `value-adapters.ts`：空数字到 null 的值转换。
- `tree-table.tsx`：开启现有虚拟表格，通过 react-use/useMeasure 测量剩余空间，设置至少 400px 的视口，隔离无关父级更新。
- `form-toolbar.tsx`：独立管理新增类型，选择类型不触发表格更新。
- `index.tsx`：组装页面、切换提交校验范围、展示提交结果。

## 受控与非受控边界

文本、密码、数字、Textarea、NativeSelect 使用 register，由 DOM 保存显示值，RHF 记录数据。
使用普通 Input 替代 MyInput；本页面不再提供 MyInput 的清空按钮和密码显隐功能。
输入没有造成错误变化时，不需要为了同步 value 而渲染外层单元格；不保证底层组件内部完全没有渲染。
其余 Select、Combobox、Calendar、Slider、OTP、布尔控件等继续通过 useController 管理。
FieldFeedback 使用 useFormState 的 name/exact 精确订阅，错误变化时才更新反馈 UI。

## 虚拟列表与字段生命周期

- 页面通过 virtual 和 height 开启公共表格现有能力，没有修改其内部实现。父表单占满路由高度，顶部内容保持自然高度，表格区域使用 flex-1；useMeasure 测量该区域，表格高度为 Math.max(剩余高度, 400)，空间不足 400px 时由页面滚动承载，不裁切表格。
- React 行 key 使用 TanStack 默认行 ID，编辑器 key 与字段名称绑定内部节点 ID；行重新编号后编辑器按实际节点重新挂载。内部虚拟器的 getItemKey、overscan、测量逻辑保持原样。
- shouldUnregister 为 false：滚出视口、折叠只卸载 UI，保留值及错误。
- 非受控字段重新挂载时，defaultValue 从 RHF 最新值读取，register 的 ref 再接管 DOM。
- 真正删除时递归 unregister，清理整棵子树的值、错误及 touched 状态。
- 新增操作先 setValue，再挂载节点；不会用默认值覆盖其他节点的编辑结果。
- 提交失败会展开全部节点并提示错误数量。公共组件没有公开滚动定位接口，因此暂不自动定位屏幕外错误行。
- 首次挂载公共表格时仍可能先渲染普通表格，再切换虚拟分支；页面用 useMeasure 的容器回调 ref 保证切换发生，未改写公共组件。

## 校验与值约定

RHF 的 resolver options.names 只描述已注册字段，不能可靠区分提交与编辑。
页面在提交期间显式设置 validateAll，确保尚未挂载的节点也经过 Zod 校验；普通变更按 names 查索引校验。
字段之间目前没有联动校验；将来增加依赖关系时，需要将受影响字段加入增量校验范围。

- 输入、密码、文本域、OTP 为字符串；数字为空时为 null，其他时候为有限数字。
- false 和 0 都是有效必填值；单选为空为 null，多选为字符串数组。
- 单值 Slider 为数字，范围 Slider 为数字数组。
- 日期为本地 YYYY-MM-DD，范围为 {from, to}，不存储带时区的时间戳。
- 提交时组合配置和值，生成带 inputValue 的树；JSON 展示最近一次成功提交的快照。

## 扩展控件

1. 在 ControlConfig 增加配置分支，声明必需参数。
2. 在 controlTypes、createNode 补充目录项和匹配的有效默认值。
3. 决定接入方式：非受控分支须支持标准 ref/name/onChange/onBlur；其他组件走受控适配。
4. 在 validateValue 补充校验，测试有效值、空值及错误边界。

配置只包含可序列化数据。

## 校验

在应用目录运行：

```sh
pnpm test
# 监听文件变化并重新运行测试
pnpm test:watch
```

测试使用 Vitest 的 Node 环境，保留 node:assert/strict 断言。
测试包括整树与增量校验、屏幕外字段校验、RHF ref 卸载/重挂载协议、数字空值、删除清理及引用稳定性。
ref 协议测试使用最小 input 对象，不代替真实浏览器中的滚动、行高和焦点验证。
