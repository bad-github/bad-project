import {useMemo} from 'react';
import type {EChartsOption} from 'echarts';
import BaseChart from '@/components/echarts/base-chart';
import {getData3, data3, options3} from './tool';

export default function StackedLine() {
  
  const data = useMemo<EChartsOption>(() => {
    const {source} = getData3(data3);
    const result = {...options3, dataset: {dimensions: (options3.dataset as any).dimensions, source}};
    return result;
  }, [data3]);

  return <BaseChart options={data} />;
}
