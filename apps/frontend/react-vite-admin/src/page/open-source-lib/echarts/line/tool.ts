import type {LineData} from '../types';
import type {EChartsOption, SeriesOption} from 'echarts';

export const markLineOption: SeriesOption = {
  // 竖直线
  type: 'line',
  markLine: {
    symbol: 'none', // 不显示箭头
    label: {
      show: false,
    },
    lineStyle: {
      width: 2,
      color: '#ff4d4f',
      type: 'dashed',
    },
    data: [{xAxis: 3}],
  },
};

export const options1: EChartsOption = {
  title: {
    text: 'Line',
  },
  tooltip: {
    trigger: 'axis',
    confine: true, // 允许在图表区域外显示
    axisPointer: {
      type: 'cross',
      label: {
        show: false,
      },
    },
  },
  toolbox: {
    feature: {
      saveAsImage: {},
    },
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [],
  },
  yAxis: {
    type: 'value',
    axisLine: {
      show: true, // 显示轴线
    },
    axisTick: {
      show: true, // 显示刻度
    },
  },
  series: [
    {
      data: [],
      type: 'line',
    },
  ],
};

export const options2: EChartsOption = {
  grid: {
    // show: true,
    // backgroundColor: 'skyblue',
    // left: '10%',
    // right: '20%',
    // top: '60px'
  },
  xAxis: {
    type: 'category',
    data: [],
  },
  yAxis: {
    type: 'value',
  },
  /**
   * startValue，endValue 最好给不同的值才看得到效果
   * 根据xAxis.data得知：折线一共7个点，缩放区域便是按比例分成了7份
   * 数据本身：
   * '1'~'2'：图中2个点，第一个点是x轴'1'对应点y轴数据
   * '1'~'3'：图中3个点
   * '1'~'7'：图中7个点
   * '2'~'5'：图中4个点
   */
  dataZoom: [
    {
      // 数值模式：x轴范围
      startValue: 0, // x轴的索引
      endValue: 0,
      type: 'slider', // 可视化滑块
      realtime: true, // 拖动时实时刷新
      height: 30,
      bottom: 20,
      id: 'zoomId-slider',
    },
    {
      type: 'inside', // 鼠标、滚轮等手势
      realtime: true,
      filterMode: 'none',
      id: 'zoomId-inside',
    },
  ],
  series: [
    {
      type: 'line',
      symbolSize: 8,
      data: [],
    },
  ],
};

export const options3: EChartsOption = {
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['a', 'b', 'c', 'd', 'e'],
    formatter: function (name) {
      return name;
    },
  },
  grid: {
    // left: '3%',
    // right: '4%',
    // bottom: '3%',
    // containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: 'a',
      type: 'line',
      connectNulls: true,
      itemStyle: {
        color: 'rgb(59, 124, 255)',
      },
      encode: {
        x: 'xaxis',
        y: 'a',
      },
    },
    {
      name: 'b',
      type: 'line',
      itemStyle: {
        color: 'rgba(255, 0, 0, 1)',
      },
      encode: {
        x: 'xaxis',
        y: 'b',
      },
    },
    {
      name: 'c',
      type: 'line',
      itemStyle: {
        color: 'rgba(255, 181, 64, 1)',
      },
      encode: {
        x: 'xaxis',
        y: 'c',
      },
    },
    {
      name: 'd',
      type: 'line',
      connectNulls: true,
      itemStyle: {
        color: 'rgba(255, 120, 51, 1)',
      },
      encode: {
        x: 'xaxis',
        y: 'd',
      },
    },
    {
      name: 'e',
      type: 'line',
      connectNulls: true,
      itemStyle: {
        color: 'rgba(11, 219, 168, 1)',
      },
      // 默认是encode: {x: 0, y: 1}，只有dataset才支持字符串映射
      encode: {
        x: 'xaxis',
        y: 'e',
      },
    },
  ],
  dataset: {
    /**
     * 由于echart解析dataset时，默认根据source第一行的数据结构推断字段
     * 当source对象中的属性是动态的时
     *    若第一行缺失字段，折线会少一条
     *    若>第一行缺少字段，折线会正常显示
     *    若任何对象中的属性是假值时，搭配series中的connectNulls:true使用
     *
     */
    dimensions: ['xaxis', 'a', 'b', 'c', 'd', 'e', '多余2'],
    source: [],
  },
};

export const data3: LineData[] = [
  {xaxis: 'day1', yaxis: {a: 10, b: 20, c: 30, e: 50}},
  {xaxis: 'day2', yaxis: {a: 20, b: 30, c: 40, d: 50, e: 60}},
  {xaxis: 'day3', yaxis: {a: 30, b: 40, c: 50, d: 60, e: 70}},
  {xaxis: 'day4', yaxis: {a: 40, b: 50, c: 60, d: 70, e: 80}},
  {xaxis: 'day5', yaxis: {a: 50, b: 60, c: 70, d: 80, e: 90}},
  {xaxis: 'day6', yaxis: {a: 60, b: 70, d: 90, e: 100}},
  {xaxis: 'day7', yaxis: {a: 70, b: 80, c: 90, d: 100, e: 110}},
];

export function getData3(data: LineData[]) {
  const dimensions: string[] = ['xaxis'];
  const source = data.map((v) => {
    const obj: Record<string, any> = {};
    obj['xaxis'] = v.xaxis;
    Object.keys(v.yaxis).forEach((w) => {
      obj[w] = v.yaxis[w];
      if (!dimensions.includes(w)) {
        dimensions.push(w);
      }
    });
    return obj;
  });
  return {source, dimensions};
}

export const options4: EChartsOption = {
  tooltip: {trigger: 'axis'},
  title: [],
  grid: [],
  dataZoom: [],
  xAxis: [],
  yAxis: [],
  series: [],
};
