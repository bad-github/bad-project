import {useEffect} from 'react';
import useEcharts from '@/hooks/use-echarts';
import {option3} from './tool';

export default function MultipleBar() {
  const {chartRef, setOptions} = useEcharts();

  useEffect(() => {
    setOptions(option3);
  }, []);

  return <div className="border" ref={chartRef}></div>;
}
