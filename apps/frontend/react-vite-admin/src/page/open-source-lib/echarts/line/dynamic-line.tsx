import useEcharts from '@/hooks/use-echarts';
import {useEffect, useRef, useState} from 'react';
import {options2} from './tool';
import useAutoScrollZoom from '@/hooks/use-auto-scroll-zoom';

export default function DynamicLine() {
  const {instance, version, chartRef, setOptions} = useEcharts();
  const {getNextDataZoom} = useAutoScrollZoom({
    instance,
    version,
    // 兼容滑块的移动
    getZoomId: (id: string) => id.replace(/-(slider|inside)$/, ''),
  });

  const [options] = useState<any>(options2);
  const [x, setX] = useState(['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7']);
  const [y, setY] = useState([150, 230, 224, 218, 135, 147, 260]);
  const zoomRef = useRef<boolean>(false);
  useEffect(() => {
    if (!instance) return;
    const handleDataZoomChange = () => {
      zoomRef.current = true;
    };
    instance.on('datazoom', handleDataZoomChange);
    return () => {
      instance.off('datazoom', handleDataZoomChange);
    };
  }, [instance, version]);

  // appendData
  /* useEffect(() => {
    if (x.length > 100) return;
    const timer = setInterval(() => {
      const newX = [...x, `day${x.length + 1}`];
      const newY = [...y, Math.floor(Math.random() * 100)];
      setX(newX);
      setY(newY);
      data.xAxis.data = x;
      data.series[0].data = y;
      if (zoomRef.current) {
        const option: any = instance?.getOption();
        const startIndex = option.dataZoom[0].startValue;
        const endIndex = option.dataZoom[0].endValue;
        data.dataZoom[0].startValue = x[startIndex];
        // data.dataZoom[0].endValue = x[endIndex];
        data.dataZoom[0].endValue = x[endIndex + 1];
      } else {
        // 要保证endValue是echartsInstance.current.setOption(data)中data的最后一项
        data.dataZoom[0].endValue = x[x.length - 1];
      }
      setOptions({...data});
    }, 1000);
    return () => clearInterval(timer);
  }, [x.length, y.length]); */
  useEffect(() => {
    if (x.length > 100) return;
    const timer = setInterval(() => {
      const newX = [...x, `day${x.length + 1}`];
      const newY = [...y, Math.floor(Math.random() * 100)];
      setX(newX);
      setY(newY);
      options.xAxis.data = x;
      options.series[0].data = y;
      const nextZoom = getNextDataZoom(options.dataZoom[0].id, x.length);
      setOptions({...options, dataZoom: [{...options.dataZoom[0], ...(nextZoom ?? {})}, ...options.dataZoom.slice(1)]});
    }, 1000);
    return () => clearInterval(timer);
  }, [x.length, y.length]);

  return <div className="border" ref={chartRef}></div>;
}
