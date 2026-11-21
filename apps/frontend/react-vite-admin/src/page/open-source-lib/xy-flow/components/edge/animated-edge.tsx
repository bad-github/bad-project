import {memo, useEffect, useMemo} from 'react';
import {BaseEdge, useReactFlow} from '@xyflow/react';
import type {Edge, EdgeProps} from '@xyflow/react';
import {pathMeasurer} from './path-measurer';
import {EdgeType} from '../../types';

export type TAnimatedEdge = Edge<{paths: string[][]}, typeof EdgeType.animatedEdge>;
export const animateEdgeId = 'graph-animate-edge-id';
const PIXELS_PER_SECOND = 150; // 定义物理速度（每秒跑 150 像素），球在整条路径上匀速运动

type SegmentInfo = {
  segmentIndex: number; // 这个段在时间轴上的位置（第几段），而不是路径里的index
  path: string; // 此段的svg path
  pathIndexes: number[]; // 哪些路径（是路径的index）包含此段
};

type Particle = {
  segments: string[];
  startIndex: number;
  pathIndexes: number[];
};

/**
 * 判断数组是否完全相等（顺序无关）
 */
function sameArray(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  return a.every((v) => b.includes(v));
}

/**
 * 获取粒子最后一个 segment 对应的 pathIndexes
 */
function getLastPathIndexes(particle: Particle, timeline: SegmentInfo[]): number[] {
  const lastIndex = particle.startIndex + particle.segments.length - 1;
  return (
    timeline.find((s) => s.segmentIndex === lastIndex && s.path === particle.segments[particle.segments.length - 1])
      ?.pathIndexes || []
  );
}

/**
 * 粒子模型
 *  (1)一段=一个或多个流
 *  (2)一个流=一个小球
 * 多条路径在某一个段上重叠，就只存在一个粒子
 * 当pathIndexes.length>=1时，存在粒子
 * 当上一段的pathIndexes集合不等于当前段的pathIndexes集合时，粒子发生分裂
 */

const AnimatedEdge = (props: EdgeProps<TAnimatedEdge>) => {
  const {data} = props;
  const {deleteElements} = useReactFlow();
  const paths = data?.paths || [];

  /**
   * 构建segment时间轴，路径中不同的path是一个时间段，所有不同path组成的长度便是时间轴的段数
   */
  const segmentsTimeline: SegmentInfo[] = useMemo(() => {
    const maxLen = Math.max(...paths.map((p) => p.length));
    const timeline: SegmentInfo[] = [];

    for (let i = 0; i < maxLen; i++) {
      const map = new Map<string, number[]>();
      paths.forEach((path, pathIdx) => {
        const seg = path[i];
        if (!seg) return;
        if (!map.has(seg)) {
          map.set(seg, []);
        }
        // 路径为key，包含此路径的index集合为value
        map.get(seg)!.push(pathIdx);
      });
      // map.forEach((值，键) =>{})
      map.forEach((pathIndexes, path) => {
        timeline.push({segmentIndex: i, path, pathIndexes});
      });
    }
    return timeline;
  }, [paths]);

  /**
   * 将 segmentsTimeline 合并成粒子
   * 相邻 segment，只要 pathIndexes 完全一致，就属于同一个粒子
   */
  const particles: Particle[] = useMemo(() => {
    const result: Particle[] = [];
    for (const seg of segmentsTimeline) {
      const last = result[result.length - 1];
      if (
        last &&
        // 当前段在时间轴上紧挨着上一个粒子末尾
        last.startIndex + last.segments.length === seg.segmentIndex &&
        // 当前段和上一个粒子属于同一组路径
        sameArray(getLastPathIndexes(last, segmentsTimeline), seg.pathIndexes)
      ) {
        // 继续同一个粒子
        last.segments.push(seg.path);
      } else {
        // 新粒子
        result.push({
          segments: [seg.path],
          startIndex: seg.segmentIndex,
          pathIndexes: seg.pathIndexes,
        });
      }
    }

    return result;
  }, [segmentsTimeline]);

  const physicsTimeline = useMemo(() => {
    const pathPhysicsMap = new Map<number, Map<number, {dur: number; begin: number}>>();
    let maxTotalTime = 0;
    // 预先清空缓存（如果节点位置变了，旧的 pathData 字符串会变，所以缓存依然有效）
    // 只有当路径字符串完全一致时才走缓存
    for (let pIdx = 0; pIdx < paths.length; pIdx++) {
      const path = paths[pIdx];
      const segmentMap = new Map<number, {dur: number; begin: number}>();
      let accumulatedTime = 0;

      for (let sIdx = 0; sIdx < path.length; sIdx++) {
        const segPath = path[sIdx];
        // 优化：从缓存读取或计算
        const len = pathMeasurer.getLength(segPath);
        const dur = len / PIXELS_PER_SECOND;

        segmentMap.set(sIdx, {dur, begin: accumulatedTime});
        accumulatedTime += dur;
      }

      pathPhysicsMap.set(pIdx, segmentMap);
      if (accumulatedTime > maxTotalTime) maxTotalTime = accumulatedTime;
    }
    return {pathPhysicsMap, totalTime: maxTotalTime};
  }, [paths]); // 仅在路径数据变化时重新计算

  /**
   * 动画结束后，删除这条临时 edge
   */
  useEffect(() => {
    const timer = setTimeout(
      () => {
        deleteElements({edges: [{id: animateEdgeId}]});
      },
      physicsTimeline.totalTime * 1000 + 500
    ); // 多留 0.5s 缓冲
    return () => clearTimeout(timer);
  }, [physicsTimeline, deleteElements]);

  /**
   * 渲染粒子
   * 一个粒子 = 一个 circle = 一条连续运动轨迹
   */

  if (!paths.length) return null;
  console.log('paths', paths);
  return (
    <>
      {paths.map((path, idx) => (
        <BaseEdge
          key={idx}
          id={animateEdgeId + idx}
          className="react-flow__edge-path"
          path={path.join('')}
          style={{stroke: '#ff0073'}}
        />
      ))}
      {/* 渲染粒子 */}
      {particles.map((particle, idx) => {
        const {startIndex, segments, pathIndexes} = particle;
        // 取该粒子包含的第一条路径作为时间参考（因为合并的路径在该段物理长度是一致的）
        const myPathPhysics = physicsTimeline.pathPhysicsMap.get(pathIndexes[0]);
        const startInfo = myPathPhysics?.get(startIndex);
        if (!startInfo) return null;
        // 计算粒子总时长：累加属于自己的物理时长
        let particleDur = 0;
        for (let i = 0; i < segments.length; i++) {
          particleDur += myPathPhysics?.get(startIndex + i)?.dur || 0;
        }
        const begin = startInfo.begin;
        const pathData = segments.join('');

        return (
          <circle key={idx} r="10" fill="#ff0073" opacity={0}>
            <animateMotion
              dur={`${particleDur}s`}
              begin={`${begin}s`}
              path={pathData}
              repeatCount={1}
              fill="freeze"
              calcMode="linear" // 必须线性
            />
            {/* 出现：防止初始左上角 */}
            <animate attributeName="opacity" from="0" to="1" begin={`${begin}s`} dur="0.05s" fill="freeze" />
            {/* 消失：防止结束后残留 */}

            <animate
              attributeName="opacity"
              from="1"
              to="0"
              begin={`${begin + particleDur - 0.05}s`}
              dur="0.05s"
              fill="freeze"
            />
          </circle>
        );
      })}
    </>
  );
};

export default memo(AnimatedEdge);
