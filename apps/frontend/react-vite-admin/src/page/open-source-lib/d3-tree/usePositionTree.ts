import {useRef, useState} from 'react';

export type TPosition = 'left' | 'center' | 'top';
export type TDistance = {x: number; y: number};

export interface IPosResult {
  dis: TDistance;
  setDis: (dis: TDistance) => void;
  setPos: (pos: TPosition) => void; // React.Dispatch<React.SetStateAction<TPosition>>
  setScalePos: (pos: TPosition, zoom: number) => void;
  elRef: React.RefObject<HTMLDivElement | null>;
}
/**
 *
 * @param position left：从左往右，center：居中，right：从右往左。可以拿到position后在useEffect中决定布局位置，但为了兼容特殊场景，暂时不在useEffect中处理，因为useEffect和Tree的onUpdate都会触发
 * @param halfNodeHeight 容器宽度，因为布局原因，需要引入halfNodeWidth
 * @returns
 */
export const usePositionTree = (
  _position: TPosition,
  halfNodeWidth: number = 0,
  halfNodeHeight: number = 0
): IPosResult => {
  const [dis, setDis] = useState<TDistance>({x: 0, y: 0});
  const elRef = useRef<HTMLDivElement | null>(null);

  // useEffect(() => {
  //   console.log('useEffect usePosition');
  //   if (!elRef.current) return;
  //   const {width, height} = elRef.current.getBoundingClientRect();
  //   if (_position === 'left') {
  //     setDis({x: halfNodeWidth, y: height / 2});
  //   } else if (_position === 'center') {
  //     setDis({x: halfNodeWidth + width / 2, y: height / 2});
  //   }
  // }, []);

  /**
   * 对齐方式
   * @param pos
   * @returns
   */
  const setPos = (pos: TPosition) => {
    if (!elRef.current) return;
    const {width, height} = elRef.current.getBoundingClientRect();
    console.log(width / 2, height / 2, 'getBoundingClientRect');
    if (pos === 'left') {
      setDis({x: halfNodeWidth, y: height / 2});
    } else if (pos === 'center') {
      setDis({x: halfNodeWidth + width / 2, y: height / 2});
    } else if (pos === 'top') {
      // setDis({x: 0, y: 0});
      setDis({x: width / 2, y: halfNodeHeight});
    }
  };

  /**
   * 对齐时考虑缩放
   * @param pos
   * @param zoom 缩放比例
   * @returns
   */
  const setScalePos = (pos: TPosition, zoom: number) => {
    console.log('setScalePos usePosition');
    if (!elRef.current) return;
    const {width, height} = elRef.current.getBoundingClientRect();
    if (pos === 'left') {
      setDis({x: halfNodeWidth * zoom, y: height / 2});
    } else if (pos === 'center') {
      setDis({x: halfNodeWidth * zoom + width / 2, y: height / 2});
    } else if (pos === 'top') {
      setDis({x: 0, y: 0});
      // setDis({x: halfNodeWidth * zoom + width / 2, y: 0});
    }
  };

  return {dis, setDis, setPos, setScalePos, elRef};
};
