import {useEffect, useMemo} from 'react';
import type {
  DataZoomComponentOption,
  GridOption,
  SeriesOption,
  TitleOption,
  XAXisOption,
  YAXisOption,
} from 'echarts/types/dist/shared';
import useEcharts from '@/hooks/use-echarts';
import {options4} from './tool';

const data = [
  {
    id: 'a',
    color: 'red',
    line: [
      {x: 'day1', y: 150},
      {x: 'day2', y: 230},
      {x: 'day3', y: 224},
      {x: 'day4', y: 218},
      {x: 'day5', y: 135},
      {x: 'day6', y: 147},
      {x: 'day7', y: 260},
    ],
  },
  {
    id: 'b',
    color: 'yellow',
    line: [
      {x: 'day1', y: 50},
      {x: 'day2', y: 330},
      {x: 'day3', y: 220},
      {x: 'day4', y: 180},
      {x: 'day5', y: 140},
      {x: 'day6', y: 70},
      {x: 'day7', y: 880},
    ],
  },
  {
    id: 'c',
    color: 'blue',
    line: [
      {x: 'day1', y: 1500},
      {x: 'day2', y: 200},
      {x: 'day3', y: 1000},
      {x: 'day4', y: 800},
      {x: 'day5', y: 500},
      {x: 'day6', y: 40},
      {x: 'day7', y: 1100},
    ],
  },
];

function buildOptions(data: Record<string, any>) {
  const chartHeight = 200; // 单个 grid 高度
  const chartDistance = 100; // grid 间距
  const zoomDistance = 30; // zoom 距离 x 轴的距离
  const paddingTop = 50; // 上边距
  const paddingBottom = 100; // 下边距
  const zoomHeight = 20;

  const grids: GridOption[] = [];
  const titles: TitleOption[] = [];
  const dataZooms: DataZoomComponentOption[] = [];
  const xAxis: XAXisOption[] = [];
  const yAxis: YAXisOption[] = [];
  const series: SeriesOption[] = [];
  data.forEach((v: any, index: number) => {
    const line = v.line || [];
    titles.push({text: v.id, top: paddingTop / 2 + (chartHeight + chartDistance) * index});
    // 多个grid，从上到下排列
    grids.push({
      top: paddingTop + (chartHeight + chartDistance) * index,
      height: chartHeight,
      // 最后一个grid有bottom
      ...(index === data.length - 1 ? {bottom: paddingBottom} : {}),
    });
    // 多个dataZoom
    dataZooms.push(
      {
        type: 'slider',
        realtime: true,
        xAxisIndex: index,
        height: zoomHeight,
        top: paddingTop + chartHeight * (index + 1) + chartDistance * index + zoomDistance,
      },
      {type: 'inside', realtime: true, xAxisIndex: index, filterMode: 'none' as any}
    );
    // 每个grid一条x轴
    xAxis.push({type: 'category', boundaryGap: false, gridIndex: index});
    // 每个grid一条y轴
    yAxis.push({type: 'value', gridIndex: index});
    // series绑定x轴和y轴
    series.push({
      type: 'line',
      symbolSize: 10,
      connectNulls: true,
      xAxisIndex: index,
      yAxisIndex: index,
      name: v.id,
      lineStyle: {color: v.color},
      itemStyle: {color: v.color},
      data: line.map((p: any) => [p.x, p.y]),
    });
  });
  return {
    totalHeight: chartHeight * data.length + chartDistance * (data.length - 1) + paddingTop + paddingBottom,
    options: {
      ...options4,
      title: titles,
      grid: grids,
      dataZoom: dataZooms,
      xAxis,
      yAxis,
      series,
    },
  };
}

export default function GridLine() {
  const {instance, chartRef, setOptions} = useEcharts();

  const result = useMemo(() => {
    return buildOptions(data);
  }, []);

  useEffect(() => {
    if (!instance) return;
    const {totalHeight, options} = result;
    if (!totalHeight || !options) return;
    requestAnimationFrame(() => {
      setOptions(options as any);
      // echart在初始化时就确定了高度，仅改样式无法生效，需要使用resize
      instance.resize();
    });
  }, [result, instance]);

  return <div className="row-span-4 border" style={{height: result.totalHeight}} ref={chartRef}></div>;
}
