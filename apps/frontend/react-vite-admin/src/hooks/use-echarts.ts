import {useEffect, useRef, useState} from 'react';
import type {ECharts, SetOptionOpts} from 'echarts/core';
import type {EChartsOption} from 'echarts';
import echarts from '@/components/echarts/echarts.config';
import {chartMask} from '@/components/echarts/tool';
import {useTheme} from '@/hooks/use-theme';

export default function useEcharts() {
  const {resolvedTheme: theme = 'light'} = useTheme();
  const chartInstance = useRef<ECharts>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const lastOption = useRef<EChartsOption>(null);
  // 有一些外部hook可能需要注册echarts的其他事件，当实例销毁时需要重新监听，可实例的ref是无法作为依赖的，所以添加一个版本号
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!chartRef.current) return;
    chartInstance.current = echarts.init(chartRef.current, theme);
    setVersion((v) => v + 1);
    setOptions(lastOption.current);

    function updateSize() {
      chartInstance.current?.resize();
    }

    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  useEffect(() => {
    chartInstance.current?.setTheme(theme === 'dark' ? 'dark' : 'default');
  }, [theme]);

  function setOptions(options: EChartsOption | null, opts?: SetOptionOpts) {
    if (!options) return;
    lastOption.current = options;
    chartInstance.current?.setOption(options, opts);
  }

  function showLoading() {
    chartInstance.current?.showLoading({text: 'loading...', maskColor: chartMask[theme]});
  }

  function hideLoading() {
    chartInstance.current?.hideLoading();
  }

  return {
    // 返回 ref 时用 get，是为了避免返回“值快照”，而是始终读到 ref.current 的最新值。除了hook的内部状态或dom ref，建议都使用get
    get instance() {
      return chartInstance.current;
    },
    version,
    chartRef,
    setOptions,
    showLoading,
    hideLoading,
  };
}
