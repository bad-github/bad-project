import * as echarts from 'echarts/core';
import type {EChartsOption} from 'echarts';
import type {BarData} from '../types';
import {number} from '@workspace/utils';

export const axisLabelWidth = 130;
// 宽度能完全显示数字内容就行
export const gridRight = 80;

export const data1: BarData[] = [
  {issueNum: 100000000000, ruleName: '很长的很长的很长的很长的很长的很长的规则'},
  {issueNum: 99999999, ruleName: '规则2'},
  {issueNum: 999999999, ruleName: '规则3'},
];

export const options1: EChartsOption = {
  grid: {
    top: 24,
    right: gridRight,
    bottom: 0,
    left: axisLabelWidth + 40,
  },
  tooltip: {
    show: true,
  },
  yAxis: {
    type: 'category',
    axisLabel: {
      /**
       * 当label过长时，最大宽度是axisLabelWidth
       * 当label过小时，宽度是字数自适应，并不是定义的axisLabelWidth
       * 并不是所有的label计算出来都接近130，比如中文，小写字母等
       */
      width: axisLabelWidth + 10,
      overflow: 'truncate',
    },
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false, // 隐藏刻度线
    },
  },
  xAxis: {
    show: false,
  },
  series: [
    {
      type: 'bar',
      encode: {
        x: 'issueNum',
        y: 'ruleName',
      },
      barWidth: 20,
      showBackground: true,
      backgroundStyle: {
        borderRadius: 50,
      },
      label: {
        show: true,
        formatter: (params: any) => {
          return `${params?.value?.issueNum || params?.value?.issueNum === 0 ? number.formatLargeNumber(params?.value?.issueNum?.toString()) : ''}`;
        },
      },
      itemStyle: {
        borderRadius: 50,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: 'rgba(0, 70, 198, 1)',
          },
          {
            offset: 1,
            color: 'rgba(0, 143, 255, 1)',
          },
        ]),
      },
      animation: true,
      animationDelay: 1000,
      animationDuration: 1500,
      animationDurationUpdate: 1500,
    },
  ],
  dataset: {
    dimensions: ['ruleName', 'issueNum'],
    source: [
      {issueNum: 100, ruleName: '规则1'},
      {issueNum: 200, ruleName: '规则2'},
    ],
  },
};

export const option2: EChartsOption = {
  tooltip: {
    trigger: 'item',
  },
  xAxis: {
    axisTick: {
      show: true,
    },
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  yAxis: {
    name: 'count',
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
      label: {
        show: true,
        position: 'top',
      },
      data: [120, 200, 150, 80, 70, 110, 130],
      type: 'bar',
    },
  ],
};
export const option3: EChartsOption = {
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['bar1', 'bar2', 'bar3', 'bar4'],
    formatter(name) {
      return name;
    },
  },
  xAxis: {
    axisTick: {
      show: true,
    },
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
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
      label: {
        show: true,
        position: 'inside',
        fontSize: 10,
      },
      itemStyle: {
        color: '#FB628B',
      },
      stack: 'one',
      name: 'bar1',
      type: 'bar',
      data: [10, 30, 50, 70, 90],
    },
    {
      label: {
        show: true,
        position: 'inside',
        fontSize: 10,
      },
      itemStyle: {
        color: '#FFD109',
      },
      stack: 'one',
      name: 'bar2',
      type: 'bar',
      data: [20, 40, 60, 80, 100],
    },
    {
      label: {
        show: true,
        position: 'top',
      },
      itemStyle: {
        color: '#5070DD',
      },
      name: 'bar3',
      type: 'bar',
      data: [30, 50, 70, 90, 110],
    },
    {
      label: {
        show: true,
        position: 'top',
      },
      itemStyle: {
        color: '#FF994C',
      },
      name: 'bar4',
      type: 'bar',
      data: [40, 60, 80, 100, 120],
    },
  ],
};
