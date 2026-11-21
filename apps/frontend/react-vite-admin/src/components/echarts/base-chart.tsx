import {memo, useEffect, useRef} from 'react';
import type {EChartsOption} from 'echarts';
import echarts from './echarts.config';
import {useTheme} from '@/hooks/use-theme';
import type {ECharts} from 'echarts/core';
import {chartMask} from './tool';

type TProps = {
  options: EChartsOption;
  style?: React.CSSProperties;
  loading?: boolean;
};

const BaseChart = (props: TProps) => {
  const {resolvedTheme: theme = 'light'} = useTheme();
  const {options, style, loading} = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts>(null);

  useEffect(() => {
    chartInstance.current = echarts.init(chartRef.current!, theme);
    function updateSize() {
      chartInstance.current?.resize();
    }

    window.addEventListener('resize', updateSize);

    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    // v6 提供了不用重新init和setOption的主题切换：经试验还是需要setOption
    chartInstance.current?.setTheme(theme === 'dark' ? 'dark' : 'default');
  }, [theme]);

  useEffect(() => {
    if (loading) {
      chartInstance.current?.showLoading({text: 'loading...', maskColor: chartMask[theme]});
    } else {
      chartInstance.current?.hideLoading();
    }
  }, [loading, theme]);

  useEffect(() => {
    if (!options) return;
    chartInstance.current?.setOption(options);
  }, [options, theme]);

  return <div className="border" ref={chartRef} style={style}></div>;
};

export default memo(BaseChart);
