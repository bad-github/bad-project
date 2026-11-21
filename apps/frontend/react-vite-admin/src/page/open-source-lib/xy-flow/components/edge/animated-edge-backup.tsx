import {memo, useEffect, useMemo} from 'react';
import {BaseEdge, useReactFlow} from '@xyflow/react';
import type {Edge, EdgeProps} from '@xyflow/react';
import {EdgeType} from '../../types';

export type TAnimatedEdge = Edge<{paths: string[][]}, typeof EdgeType.animatedEdge>;
export const animateEdgeId = 'can-sim-graph-animate-edge-id';
const SEGMENT_DUR = 0.75; // 每段固定时长（秒）

type SegmentInfo = {
  segmentIndex: number; // 这个段在时间轴上的位置（第几段），而不是路径里的index
  path: string; // 此段的svg path
  pathIndexes: number[]; // 哪些路径（是路径的index）包含此段
};

type Particle = {
  segments: string[];
  startIndex: number;
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
        });
      }
    }

    return result;
  }, [segmentsTimeline]);

  /**
   * 动画结束后，删除这条临时 edge
   */
  useEffect(() => {
    const maxEndIndex = Math.max(...particles.map((p) => p.startIndex + p.segments.length));
    const totalDur = maxEndIndex * SEGMENT_DUR;
    const timer = setTimeout(() => {
      deleteElements({edges: [{id: animateEdgeId}]});
    }, totalDur * 1000);

    return () => clearTimeout(timer);
  }, [particles, deleteElements]);

  if (!paths.length) return null;

  /**
   * (4)渲染粒子
   * 一个粒子 = 一个 circle = 一条连续运动轨迹
   */

  return (
    <>
      {/* 线高亮 */}
      {paths.map((path, idx) => (
        <BaseEdge
          key={idx}
          id={animateEdgeId + idx}
          className="react-flow__edge-path"
          path={path.join('')}
          style={{stroke: '#ff0073'}}
        />
      ))}
      {/* 球沿着线运动 */}
      {particles.map((particle, idx) => {
        const path = particle.segments.join('');
        const dur = particle.segments.length * SEGMENT_DUR;
        const begin = particle.startIndex * SEGMENT_DUR;

        return (
          <circle key={idx} r="10" fill="#ff0073" opacity={0}>
            <animateMotion dur={`${dur}s`} begin={`${begin}s`} path={path} repeatCount={1} fill="freeze" />
            {/* 出现：防止初始左上角 */}
            <animate attributeName="opacity" from="0" to="1" begin={`${begin}s`} dur="0.01s" fill="freeze" />
            {/* 消失：防止结束后残留 */}
            <animate
              attributeName="opacity"
              from="1"
              to="0"
              begin={`${begin + dur - 0.01}s`}
              dur="0.01s"
              fill="freeze"
            />
          </circle>
        );
      })}
    </>
  );
};

export default memo(AnimatedEdge);
