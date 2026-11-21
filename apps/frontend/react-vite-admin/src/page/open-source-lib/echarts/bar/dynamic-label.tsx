import {useMemo, useState} from 'react';
import {useMeasure} from 'react-use';
import {axisLabelWidth, data1, gridRight, options1} from './tool';
import BaseChart from '@/components/echarts/base-chart';
import {text} from '@workspace/utils';

export default function DynamicLabel() {
  const [data] = useState(data1);
  const [ref, {width}] = useMeasure<HTMLDivElement>();

  const options = useMemo(() => {
    const maxLabelLength = Math.min(
      data.reduce((max, v) => {
        return Math.max(max, text.getTextWidth(v.ruleName, '12px'));
      }, 0),
      axisLabelWidth
    );

    const labelWidth = maxLabelLength + 10;
    const gridLeft = maxLabelLength + 40;

    return {
      ...options1,
      grid: {
        ...options1.grid,
        // label距离左边距40
        left: gridLeft,
      },
      yAxis: {
        ...options1.yAxis,
        axisLabel: {
          ...(options1.yAxis as any)?.axisLabel,
          width: labelWidth,
        },
      },
      series: [
        {
          ...(options1?.series as any)?.[0],
          label: {
            ...(options1?.series as any)?.[0]?.label,
            // position: [0, 0],
            position: width ? [(width || 1920) - gridLeft - gridRight, 0] : 'inside',
            offset: [8, 4],
          },
        },
      ],
      dataset: {
        dimensions: (options1.dataset as any).dimensions,
        source: data,
      },
    };
  }, [data, width]);

  return (
    <div ref={ref}>
      <BaseChart options={options} style={{height: '100%'}} />
    </div>
  );
}
