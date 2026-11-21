import * as echarts from 'echarts/core';
// 引入用到的图表
import {BarChart, LineChart, PieChart} from 'echarts/charts';
// 引入提示框、数据集等组件
import {
  DatasetComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  TransformComponent,
  MarkLineComponent,
} from 'echarts/components';
// 引入标签自动布局、全局过渡动画等特性
import {LabelLayout, UniversalTransition} from 'echarts/features';
// 引入渲染器，必须
import {SVGRenderer} from 'echarts/renderers';

// 类型相关
// 系列类型的定义后缀都为 SeriesOption
import type {BarSeriesOption, LineSeriesOption, PieSeriesOption} from 'echarts/charts';
// 组件类型的定义后缀都为 ComponentOption
import type {TooltipComponentOption, TitleComponentOption, GridComponentOption} from 'echarts/components';
import type {ComposeOption} from 'echarts/core';

// 通过 ComposeOption 来组合出一个只有必须组件和图表的 Option 类型：没有快速跳转到定义
export type ECOption = ComposeOption<
  | BarSeriesOption
  | PieSeriesOption
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
>;

// 注册必须的组件
echarts.use([
  BarChart,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  UniversalTransition,
  // CanvasRenderer,
  SVGRenderer,
  LabelLayout,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  MarkLineComponent,
]);

// 其他地方导入此echarts，才会按需打包
export default echarts;
