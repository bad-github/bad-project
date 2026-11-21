import {tree} from '@workspace/utils';

export const straightPathFunc1 = (linkDatum: any, orientation: any) => {
  const {source, target} = linkDatum;
  return orientation === 'horizontal'
    ? `M${source.y},${source.x}L${target.y},${target.x}`
    : `M${source.x},${source.y}L${target.x},${target.y}`;
};
export const straightPathFunc2 = (linkDatum: any, orientation: any) => {
  const {source, target} = linkDatum;
  return orientation === 'horizontal'
    ? `M${source.y},${source.x}H${target.y / 2}V${target.x}H${target.y}`
    : `M${source.x},${source.y}V${target.x / 2}H${target.y}V${target.y}`;
};

export const data = tree.generateDifferentTree([1, 3, 2, 1]);
