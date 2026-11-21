import {EdgeType} from '../../types';
import AnimatedEdge from './animated-edge';
import CommonEdge from './common-edge';
import FloatingEdge from './floating-edge';

export const EdgeTypeComponent = {
  [EdgeType.commonEdge]: CommonEdge,
  [EdgeType.floatingEdge]: FloatingEdge,
  [EdgeType.animatedEdge]: AnimatedEdge,
};
