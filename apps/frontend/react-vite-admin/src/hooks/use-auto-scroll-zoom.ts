import type {EChartsType} from 'echarts/core';
import {useRef, useEffect, useCallback} from 'react';

type ZoomState = {
  startIndex: number;
  endIndex: number;
  userSetStart: boolean;
  userLockEnd: boolean; // 是否被用户锁定
};

type TProps = {
  instance: EChartsType | null;
  version: number;
  historyThreshold?: number;
  getZoomId?: (id: string) => string;
};

export type TNextZoomFun = (
  zoomId: string,
  totalCount: number
) => {
  startValue: number;
  endValue: number;
} | null;

/**
 * @param instance
 * @param historyThreshold 历史区间阈值（当前endValue距离最新数据点的数量），默认 5
 * @param getZoomId 获取zoomId的函数，滑块和手势需要共用state

 *
 * 用户未操作时
 *  - startValue自动贴左
 *  - endValue自动贴右
 *
 * 用户操作过
 *  - startValue跟随变化操作的变化，不跟随数据的变化
 *  - endValue在历史区间范围了，不跟随数据的变化。超出历史区间，跟随数据变化（始终跟随末尾）
 */

export default function useAutoScrollZoom(props: TProps) {
  const {instance, version, historyThreshold = 5, getZoomId = (zoomId: string) => zoomId} = props;
  const zoomMapRef = useRef<Record<string, ZoomState>>({});

  function getZoomState(zoomId: string): ZoomState {
    if (!zoomMapRef.current[zoomId]) {
      zoomMapRef.current[zoomId] = {
        startIndex: 0,
        endIndex: 0,
        userSetStart: false,
        userLockEnd: false,
      };
    }
    return zoomMapRef.current[zoomId];
  }

  /**
   * 监听 dataZoom（只在“明显离开右侧”时锁定）
   */
  useEffect(() => {
    if (!instance) return;

    const handleDataZoom = (e: any) => {
      const zoomId = e.dataZoomId || e.batch[0]?.dataZoomId;
      if (!zoomId) return;
      // slider和inside共用同一个state
      const state = getZoomState(getZoomId(zoomId));
      const option: any = instance.getOption();
      const dz = option?.dataZoom?.find((t: any) => t.id === zoomId);
      // 多个grid，它们的index就对应各自的grid，所以index可以共用
      const xData = option?.xAxis?.[dz.xAxisIndex || 0]?.data;
      if (!dz || !Array.isArray(xData)) return;
      const lastIndex = xData.length - 1;
      // startValue：只记录，不影响自动逻辑
      if (typeof dz.startValue === 'number' && !isNaN(dz.startValue)) {
        state.startIndex = dz.startValue;
        state.userSetStart = true;
      }
      // endValue：决定是否“锁定”
      if (typeof dz.endValue === 'number' && !isNaN(dz.endValue)) {
        state.endIndex = dz.endValue;
        const distanceToRight = lastIndex - dz.endValue;
        state.userLockEnd = distanceToRight > historyThreshold;
      }
    };

    instance.on('datazoom', handleDataZoom);
    return () => {
      instance.off('datazoom', handleDataZoom);
    };
  }, [instance, version, historyThreshold]);

  /**
   * 数据更新时调用
   */
  const getNextDataZoom = useCallback<TNextZoomFun>((id: string, totalCount: number) => {
    if (totalCount <= 0) return null;
    const state = getZoomState(getZoomId(id));
    const lastIndex = totalCount - 1;
    let endIndex = state.endIndex;
    if (!state.userLockEnd) {
      endIndex = lastIndex;
    }
    state.endIndex = endIndex;

    return {
      startValue: state.startIndex,
      endValue: endIndex,
    };
  }, []);

  return {getNextDataZoom};
}
