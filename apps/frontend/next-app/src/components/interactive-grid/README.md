# InteractiveGrid 需求与使用

## 展示与交互

- 可包裹任意 React 内容，既能用于页面背景，也能用于有明确尺寸的小容器。
- 绘制等距网格，默认边长 48px；鼠标附近网格变亮，并出现柔和聚光灯。
- 鼠标附近采样点按距离衰减向外偏移，使用平滑曲线绘制局部弯曲。
- 鼠标移动时，光照跟随；鼠标移开时，光照淡出，网格通过弹簧与阻尼回到原位。
- 聚光灯和形变共用局部坐标；容器的位置、尺寸变化后重新适配。
- 不添加滚动监听拦截、鼠标捕获或阻止默认行为，内部链接、按钮、文字选择保持正常。

## 适配与性能

- ResizeObserver 监听容器尺寸；Canvas 作为绝对定位背景，不影响 children 的文档流。
- 亮暗主题自动匹配颜色，可传入 color 覆盖；多个实例相互独立。
- Retina 渲染，DPR 最大为 2；大区域降低采样密度，避免过多绘制。
- 鼠标移动仅更新闭包变量，不触发 React 渲染；动画收敛、离屏、后台时停止 RAF。
- 触摸操作不触发特效，避免干扰滚动；系统减少动态效果时只展示静态网格。
- 卸载时释放所有事件、ResizeObserver、IntersectionObserver 和 RAF。
- Canvas 标记 aria-hidden，不进入键盘焦点，不承担内容和交互语义。

## API

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| children | — | 前景内容 |
| className / div 属性 | — | 设置区域尺寸、圆角、背景及无障碍属性 |
| gridSize | 48 | 网格间距，最小 20px |
| radius | 180 | 聚光灯与形变半径，最小 20px |
| strength | 18 | 最大目标偏移，0～60px；0 关闭形变 |
| stiffness | 180 | 弹簧刚度，20～400，越大回弹越快 |
| color | 亮色主题黑色、暗色主题白色 | Canvas 可识别的 CSS 颜色；默认通过低透明度绘制为柔和灰阶 |

```tsx
<InteractiveGrid className="rounded-xl bg-background">
  <div className="flex h-80 items-center justify-center">任意内容</div>
</InteractiveGrid>

<InteractiveGrid className="h-48 w-72 rounded-xl" gridSize={32} radius={110} strength={12} />
```

容器需要有实际高度：可以由 children 撑开，也可以通过 className 指定。
默认 overflow-hidden 将背景与内容裁剪到容器圆角；需要跨区域浮层时应使用 Portal。

## 验收

1. Demo 大、小区域均能独立触发聚光、弯曲和移开回弹。
2. 移到内容上特效继续工作，链接可正常点击。
3. 改变窗口、亮暗主题后，网格尺寸和颜色正确更新。
4. 减少动态效果模式下不移动；无 JavaScript 时前景内容仍可阅读。
