import {toast, Separator, cn} from '@badnpm/ui';
import {useMemo, useRef, useState} from 'react';
import Tree, {type CustomNodeElementProps, type Orientation} from 'react-d3-tree';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  ChevronsDownIcon,
  ChevronsRightIcon,
  MinusIcon,
  PlusIcon,
  ScanIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react';
import {data} from './tool';
import classes from './index.module.less';
import {usePositionTree} from './usePositionTree';

interface INodeSizeProps {
  tag: string;
  nodeWidth: number;
  nodeHeight: number;
  nodePadding: number;
}
interface INodeProps {
  foreignProps: INodeSizeProps;
  handleClick: (nodeData: any) => void;
}

export default function D3Tree() {
  const foreignProps: INodeSizeProps = useMemo(
    () => ({
      tag: '你干嘛',
      nodeWidth: 200 + 16 * 2,
      nodeHeight: 64 + 16 * 2,
      nodePadding: 16,
    }),
    []
  );
  const scaleExtend = useMemo(() => ({min: 0.1, max: 2}), []); // 缩放范围
  const {
    dis,
    setDis,
    setPos,
    setScalePos,
    elRef: treeRef,
  } = usePositionTree('top', foreignProps.nodeWidth / 2, foreignProps.nodeHeight / 2); // 显示区域的左对齐、居中
  const [zoom, setZoom] = useState<number>(1); // 缩放比例
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const isMounted = useRef<boolean>(true);

  const handleClick = (nodeData: any) => {
    toast.add({title: nodeData.name, type: 'info'});
  };

  const renderNode = (props: CustomNodeElementProps & INodeProps) => {
    const {nodeDatum, toggleNode, foreignProps, handleClick} = props;
    const translateX = -foreignProps.nodeWidth / 2;
    const translateY = -foreignProps.nodeHeight / 2;
    return (
      // 考虑是在g标签还是foreignObject上设置transform={`translate(${translateX},${translateY})`}
      <g>
        {/* <circle r={64}></circle> */}
        <foreignObject
          x="0"
          y="0"
          width={foreignProps.nodeWidth}
          height={foreignProps.nodeHeight}
          style={{cursor: 'default', transform: `translate(${translateX}px,${translateY}px)`}}
        >
          <div className={classes.nodeHtml}>
            <div
              style={{
                position: 'absolute',
                inset: foreignProps.nodePadding, // 四周都要设置，因为在水平和垂直都要展示展开、收起的图标
              }}
              className="bg-card rounded-md border p-2"
              onClick={() => handleClick(nodeDatum)}
            >
              {nodeDatum.children && nodeDatum.children.length > 0 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode();
                  }}
                  className={cn(classes.toggleIcon, orientation === 'vertical' ? classes.bottomPos : classes.rightPos)}
                >
                  {nodeDatum.__rd3t.collapsed ? <PlusIcon className="size-4" /> : <MinusIcon className="size-4" />}
                </span>
              )}
              <div>{nodeDatum.name}</div>
            </div>
          </div>
        </foreignObject>
      </g>
    );
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex h-8 items-center gap-1 self-start rounded-md border px-3 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:cursor-pointer">
        <span
          title="左对齐"
          onClick={() => {
            setScalePos('left', zoom);
          }}
        >
          <AlignLeftIcon />
        </span>
        <span
          title="居中对齐"
          onClick={() => {
            setScalePos('center', zoom);
          }}
        >
          <AlignCenterIcon />
        </span>
        <Separator orientation="vertical" />
        <span
          title="水平布局"
          onClick={() => {
            setOrientation('horizontal');
          }}
        >
          <ChevronsRightIcon />
        </span>
        <span
          title="垂直布局"
          onClick={() => {
            setOrientation('vertical');
          }}
        >
          <ChevronsDownIcon />
        </span>
        <Separator orientation="vertical" />
        <span title="100%" onClick={() => setZoom(1)}>
          <ScanIcon className="!size-4" />
        </span>
        <span
          title="放大"
          onClick={() => {
            // 8x%=>90%
            if (zoom < scaleExtend.max) {
              console.log(zoom, Number(Math.floor(zoom * 10) / 10 + 0.1).toFixed(1), '放大');
              // 向下取整
              setZoom(Number((Math.floor(zoom * 10) / 10 + 0.1).toFixed(1)));
            }
          }}
        >
          <ZoomInIcon />
        </span>
        <span
          title="缩小"
          onClick={() => {
            if (zoom > scaleExtend.min) {
              console.log(zoom, Math.ceil(zoom * 10) / 10 - 0.1, '缩小');
              // 向上取整
              setZoom(Number((Math.ceil(zoom * 10) / 10 - 0.1).toFixed(1)));
            }
          }}
        >
          <ZoomOutIcon />
        </span>
        <span className="ml-2">{Math.round(zoom * 100)}%</span>
      </div>
      <div className={cn('min-h-0 flex-1', classes.treeWrapper)} ref={treeRef}>
        <Tree
          svgClassName={classes.svgWrapper}
          data={data}
          // 根节点
          rootNodeClassName={classes.rootNode}
          // 子节点
          branchNodeClassName={classes.branchNode}
          // 叶子结点：不存在children属性
          leafNodeClassName={classes.leafNode}
          // 线的样式
          pathClassFunc={({source: _source, target}, _orientation) => {
            if (!target.children) {
              return classes.lineLeaf;
            }
            return classes.lineBranch;
          }}
          // 线展示形式
          // pathFunc={straightPathFunc1}
          // 'diagonal' | 'elbow' | 'straight' | 'step';
          pathFunc="step"
          // 是否可以展开收起
          collapsible={true}
          // 初始化展开的层级
          // initialDepth={999}
          orientation={orientation}
          separation={{
            // 相同父节点的y轴
            siblings: 1.5,
            // 不同父节点的y轴
            nonSiblings: 1.4,
          }}
          zoom={zoom}
          scaleExtent={scaleExtend}
          zoomable={true}
          draggable={true}
          // 兼容缩放比例
          translate={dis}
          // 下面两个属性配合使用
          enableLegacyTransitions={true}
          transitionDuration={400}
          // 每个节点线段的长宽
          nodeSize={{x: foreignProps.nodeWidth + 100, y: foreignProps.nodeHeight}}
          renderCustomNodeElement={(props: CustomNodeElementProps) => renderNode({...props, foreignProps, handleClick})}
          onNodeClick={() => {
            console.log('onNodeClick');
          }}
          onUpdate={({node: _node, zoom: currentZoom, translate}) => {
            setZoom(currentZoom);
            if (isMounted.current) {
              setPos('left');
            } else {
              setDis(translate);
            }
            isMounted.current = false;
          }}
        />
      </div>
    </div>
  );
}
