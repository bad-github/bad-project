import {useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {options1} from './tool';
import useEcharts from '@/hooks/use-echarts';
import type {EChartsOption} from 'echarts';
import {time} from '@workspace/utils';

const getData = () => {
  const result = {
    x: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    y: [150, 230, 224, 218, 135, 147, 260],
  };
  return time.sleep<{x: string[]; y: number[]}>(result);
};

export default function BasicLineHook() {
  const {isFetching, data, isSuccess} = useQuery({queryKey: ['line1'], queryFn: getData});
  const {chartRef, setOptions, showLoading, hideLoading} = useEcharts();

  useEffect(() => {
    // todo
    // isFetching ? showLoading() : hideLoading();
    if (isFetching) {
      showLoading();
    } else {
      hideLoading();
    }
  }, [isFetching]);

  useEffect(() => {
    if (isSuccess) {
      const options: EChartsOption = {
        ...options1,
        xAxis: {...options1.xAxis, data: data?.x},
        series: [{type: 'line', data: data?.y}],
      };
      setOptions(options);
    }
  }, [isSuccess]);

  return <div className="border" ref={chartRef}></div>;
}
