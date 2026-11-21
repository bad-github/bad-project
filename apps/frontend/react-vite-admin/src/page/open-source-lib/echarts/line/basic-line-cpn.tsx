import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import type {EChartsOption} from 'echarts';
import BaseChart from '@/components/echarts/base-chart';
import {markLineOption, options1} from './tool';
import {time} from '@workspace/utils';

const getData = () => {
  const result = {
    x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    y: [150, 230, 224, 218, 135, 147, 260],
  };
  return time.sleep<{x: string[]; y: number[]}>(result);
};

export default function BasicLineCpn() {
  const {isFetching, data, isSuccess} = useQuery({queryKey: ['line1'], queryFn: getData});

  const options = useMemo<EChartsOption>(() => {
    if (isSuccess) {
      return {
        ...options1,
        xAxis: {type: 'category', data: data?.x},
        series: [{type: 'line', data: data?.y}, markLineOption],
      };
    }
    return options1;
  }, [isSuccess, data]);
  return <BaseChart loading={isFetching} options={options} />;
}
