header.isPlaceholder：判断这个 header 是否是一个“占位单元格”

- 什么时候会出现：多级表头（分组列）时，为了对齐，会自动生成一些空的 header cell 来填补列位
- 表头或表尾有可能是占位，所以需要判断。但是表体即table cell永远不是
  header.column.columnDef.header：是在 columns 配置里定义的 header 属性
- 可能是字符串，例如：`header: '姓名'`
- 可能是 JSX 或函数，例如：`header: () => <span>Age</span>`
  header.getContext()：提供渲染上下文（包含列信息、表格状态等），用来传给 header 函数。于是定义的 header: (ctx) => ... 就可以访问这个上下文
  flexRender：通用渲染工具函数，会根据 header.column.columnDef.header 的类型（字符串、函数、JSX 元素）智能决定怎么渲染
- 字符串 'Name'：直接渲染字符串
- JSX `<span>Age</span>`：直接渲染 JSX 元素
- 函数 `(ctx) => <b>{...}</b>`：调用函数并传入 ctx 渲染结果
  table.getRowModel().rows：获取处理后的最终“行模型”数据，会根据过滤、排序、分页等状态，返回当前表格应该展示的行，每个 row 都是一个 Row 实例，包含该行的状态与操作方法
  row.getVisibleCells()：获取当前行中所有可见的单元格（列）。返回的是 Cell[] 数组，每个 cell 对应一个列单元格。
- 没有被隐藏的列：列中可以配置enableHiding:true或visible: false(todo)，从而隐藏
- 没有被分组折叠
  cell.column.columnDef.cell：在 columns 中为该列定义的 cell 渲染函数，可以是一个函数、JSX、或字符串
  cell.getContext()：获取当前单元格的渲染上下文（包含 row, column, table, getValue() 等方法），这个上下文会作为参数传入 cell 函数中。
  column中定义的cell
- `cell: info => info.getValue()`：直接显示原始数据
- `cell: info => info.renderValue()`：渲染该单元格的“显示值”，调用 columnDef.cell 的嵌套渲染（递归支持嵌套格式化器或插件）
  - 若 column 中没有定义任何 cell，则渲染效果和 getValue 一致
  - 若 column 中定义了 cell，则返回 cell 渲染的实际值
- `cell: info => <i>{info.getValue()}</i>`：自定义渲染 JSX，例如加样式、图标、颜色等

### column

accessor 非函数

- 没定义id，则以accessKey为id
- 没定义header，则以accessKey为header

accessor 是函数

- 必须提供id

footer

- 默认什么都不显示，若显示需要开启footer渲染逻辑
