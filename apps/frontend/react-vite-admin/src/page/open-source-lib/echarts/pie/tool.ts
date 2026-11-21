import type {EChartsOption} from 'echarts';

export const options1: EChartsOption = {
  title: {
    text: 'Referer of a Website',
    left: '2%',
    top: 12,
  },
  tooltip: {
    trigger: 'item',
    /**
     * params.marker 就是那个带颜色的圆点 HTML
     * params.seriesName 对应 {a}
     * params.name 对应 {b}
     * params.value 对应 {c}
     * params.percent 对应 {d}
     * 自定义marker
     * <span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${params.color};"></span> =
     */
    // formatter: '{a} <br/>{b}: {c} ({d}%)',
    formatter: function (params: any) {
      return `${params.seriesName}
              <br/>
              ${params.marker} ${params.name}: ${params.value} (${params.percent}%)`;
    },
  },
  // 分类的位置
  legend: {
    top: 'center',
    left: '2%',
    orient: 'vertical',
  },
  series: [
    {
      name: 'Access From',
      type: 'pie',
      selectedMode: 'single',
      label: {
        // position: 'center',
        show: true,
        /**
         * {a}: 系列名称 (series.name)
         * {b}: 数据项名称 (data.name)
         * {c}: 数值 (data.value)
         * {d}: 百分比 (percent)
         *
         * {a|{a}}: 用 a 样式渲染系列名称
         * {abg|}: 这是一个空的样式块，通常在 rich 中被定义为背景图或背景色（abg 通常是 "Title Background" 的缩写）。
         * {hr|}: 这是一个空的样式块，通常定义了宽度、高度和背景色，用来模拟一条水平分割线
         * {per|{d}%}: 用 per 样式渲染百分比
         */
        formatter: '{a|{a}}{abg|}\n{hr|}\n    {b|{b}:}{c}, {per|{d}%}    ',
        borderColor: 'var(--border)',
        borderWidth: 1,
        borderRadius: 4,
        rich: {
          a: {
            align: 'center',
            padding: 6,
          },
          hr: {
            borderColor: 'var(--border)',
            width: '100%',
            borderWidth: 1,
            height: 0,
          },
          b: {
            fontSize: 14,
            fontWeight: 'bold',
            padding: 6,
          },
          per: {
            color: '#fff',
            backgroundColor: 'var(--primary)',
            padding: [2, 4],
            borderRadius: 4,
          },
        },
      },
      labelLine: {
        show: true,
        length: 100,
      },
      emphasis: {
        label: {
          show: true,
          // fontSize: 18,
          fontWeight: 'bold',
        },
      },
      data: [
        {value: 1048, name: 'Search Engine', selected: true, itemStyle: {color: '#FF994C'}},
        {value: 735, name: 'Direct', itemStyle: {color: '#5070DD'}},
        {value: 580, name: 'Email', itemStyle: {color: '#FFD109'}},
        {value: 484, name: 'Union Ads', itemStyle: {color: '#FB628B'}},
        {value: 300, name: 'Video Ads', itemStyle: {color: '#785DB0'}},
      ],
    },
  ],
};

const lineColors = ['#FF994C', '#5070DD', '#FFD109', '#FB628B'];
export const options2: EChartsOption = {
  legend: {
    top: 16,
  },
  tooltip: {
    trigger: 'axis',
  },
  dataset: {
    source: [
      ['product', '2012', '2013', '2014', '2015', '2016', '2017'],
      ['Milk Tea', 56.5, 82.1, 88.7, 70.1, 53.4, 85.1],
      ['Matcha Latte', 51.1, 51.4, 55.1, 53.3, 73.8, 50],
      ['Cheese Cocoa', 40.1, 62.2, 69.5, 36.4, 45.2, 32.5],
      ['Walnut Brownie', 25.2, 37.1, 41.2, 18, 33.9, 50],
    ],
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    axisPointer: {
      triggerEmphasis: false,
    },
  },
  yAxis: {
    type: 'value',
    gridIndex: 0,
    axisLine: {
      show: true,
    },
    axisTick: {
      show: true,
    },
  },
  grid: {top: 64, bottom: '50%'},
  series: [
    {
      type: 'line',
      smooth: true,
      seriesLayoutBy: 'row',
      itemStyle: {
        color: lineColors[0],
      },
      // 高亮时的样式
      emphasis: {
        disabled: true, // 鼠标移入时同时禁止高亮，只允许dispatchAction事件触发高亮，需要搭配axisPointer的配合使用
        // focus: 'series', // 让其他不相关的线变透明（变暗）
        lineStyle: {
          shadowBlur: 5, // 阴影模糊程度
          shadowColor: lineColors[0], // 阴影颜色，通常设为与线条颜色一致
          shadowOffsetY: 2,
          width: 3,
        },
      },
    },
    {
      type: 'line',
      smooth: true,
      seriesLayoutBy: 'row',
      itemStyle: {
        color: lineColors[1],
      },
      emphasis: {
        // focus: 'series',
        lineStyle: {
          shadowBlur: 5,
          shadowColor: lineColors[1],
          shadowOffsetY: 2,
          width: 3,
        },
      },
    },
    {
      type: 'line',
      smooth: true,
      seriesLayoutBy: 'row',
      itemStyle: {
        color: lineColors[2],
      },
    },
    {
      type: 'line',
      smooth: true,
      seriesLayoutBy: 'row',
      itemStyle: {
        color: lineColors[3],
      },
    },
    {
      type: 'pie',
      id: 'pie',
      top: '55%',
      radius: ['30%', '60%'],
      selectedMode: 'single',
      // emphasis: {
      //   focus: 'self',
      // },
      color: lineColors,
      tooltip: {
        trigger: 'item',
        formatter: function (params) {
          const index = (params.encode as any)?.value[0];
          const val = (params.value as any)?.[index];
          return `${params.marker} ${params.name}: <b>${val}</b> (${params.percent}%)`;
        },
      },
      label: {
        formatter: '{b}: {@2017} ({d}%)',
      },
      encode: {
        // 去寻找名为 product 的那一列,饼图会把这一列的内容（Milk Tea, Matcha Latte 等）作为每个扇区的名称（即 {b}）
        itemName: 'product',
        // 去寻找名为 2017 的那一列,饼图会把这一列的数值作为扇区的大小/比例（即 {c}）
        value: '2017',
        tooltip: '2017',
      },
      // data: [
      //   {name: 'Milk Tea', selected: true}, // 名字必须和 source 里的第一列完全对应
      //   {name: 'Matcha Latte'},
      //   {name: 'Cheese Cocoa'},
      //   {name: 'Walnut Brownie'},
      // ],
    },
  ],
};
