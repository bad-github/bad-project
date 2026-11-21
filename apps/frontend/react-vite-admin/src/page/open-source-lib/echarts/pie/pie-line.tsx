import {useEffect, useRef} from 'react';
import useEcharts from '@/hooks/use-echarts';
import {options2} from './tool';

export default function PieLine() {
  const {instance, version, chartRef, setOptions} = useEcharts();
  const lastHighlightIndex = useRef<number[]>([]);

  useEffect(() => {
    setOptions(options2);
  }, []);

  useEffect(() => {
    if (!instance) return;
    const updateAxis = (event: any) => {
      const xAxisInfo = event.axesInfo[0];
      if (xAxisInfo) {
        const dimension = xAxisInfo.value + 1;
        instance.setOption({
          series: {
            id: 'pie',
            label: {
              formatter: '{b}: {@[' + dimension + ']} ({d}%)',
            },
            encode: {
              value: dimension,
              tooltip: dimension,
            },
          },
        });
      }
    };
    const handlePieClick = (event: any) => {
      if (event.seriesId === 'pie' && event.seriesType === 'pie') {
        const currentDimension = event.encode.value[0];
        // 获取点击区域的具体数值
        const value = event.value[currentDimension];
        console.log(`点击了饼图, 名称: ${event.name}, 索引: ${event.dataIndex}, 数值: ${value}`);
        // 取消上次高亮
        instance.dispatchAction({
          type: 'downplay',
          seriesIndex: lastHighlightIndex.current,
        });
        lastHighlightIndex.current = [event.dataIndex];
        instance.dispatchAction({
          type: 'highlight',
          seriesIndex: lastHighlightIndex.current,
        });
      }
    };
    instance.on('updateAxisPointer', updateAxis);
    instance.on('click', handlePieClick);

    return () => {
      instance.off('updateAxisPointer', updateAxis);
      instance.off('click', handlePieClick);
    };
  }, [version]);

  // @ts-expect-error todo
  const _initSelect = () => {
    if (!instance) return;
    // 默认选中扇形某个区域
    instance.dispatchAction({
      type: 'select',
      seriesId: 'pie',
      dataIndex: 0,
    });
  };

  return <div className="border" ref={chartRef}></div>;
}
