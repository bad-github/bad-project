import {useMemo} from 'react';
import BaseChart from '@/components/echarts/base-chart';
import {options1} from './tool';

export default function BasicPie() {
  const options = useMemo(() => {
    return options1;
  }, [options1]);

  return <BaseChart options={options} />;
}
