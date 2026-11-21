import type {Edge, Node} from '@xyflow/react';
import {EdgeType} from '../types';

export const initialNodes: Node[] = [
  {
    id: 'IVI_CANFD',
    data: {
      label: 'IVI_CANFD',
      kind: 'network',
    },
    position: {x: 0, y: 0},
    style: {backgroundColor: 'var(--chart-2)'},
    width: 100,
    height: 40,
  },
  {
    id: 'ZCUR',
    data: {
      label: 'ZCUR',
      kind: 'gateway',
    },
    position: {x: 0, y: 0},
    style: {backgroundColor: 'var(--chart-1)'},
    width: 80,
    height: 60,
  },
  {
    id: 'IVI',
    data: {
      label: 'IVI',
      kind: 'ecu',
    },
    position: {x: 0, y: 0},
    width: 160,
    height: 80,
  },
  {
    id: 'ECANFD',
    data: {
      label: 'ECANFD',
      kind: 'network',
    },
    position: {x: 0, y: 0},
    style: {backgroundColor: 'var(--chart-2)'},
    width: 100,
    height: 40,
  },
  {
    id: 'ICD',
    data: {
      label: 'ICD',
      kind: 'ecu',
    },
    position: {x: 0, y: 0},
    width: 160,
    height: 80,
  },
  {
    id: 'MCANFD',
    data: {
      label: 'MCANFD',
      kind: 'network',
    },
    position: {x: 0, y: 0},
    style: {backgroundColor: 'var(--chart-2)'},
    width: 100,
    height: 40,
  },
  {
    id: 'PDCU',
    data: {
      label: 'PDCU',
      kind: 'gateway',
    },
    position: {x: 0, y: 0},
    style: {backgroundColor: 'var(--chart-1)'},
    width: 80,
    height: 60,
  },
  {
    id: 'EMS',
    data: {
      label: 'EMS',
      kind: 'ecu',
    },
    position: {x: 0, y: 0},
    width: 160,
    height: 80,
  },
  {
    id: 'CCANFD',
    data: {
      label: 'CCANFD',
      kind: 'network',
    },
    position: {x: 0, y: 0},
    style: {backgroundColor: 'var(--chart-2)'},
    width: 100,
    height: 40,
  },
  {
    id: 'IBC',
    data: {
      label: 'IBC',
      kind: 'ecu',
    },
    position: {x: 0, y: 0},
    width: 160,
    height: 80,
  },
  {
    id: 'HAD',
    data: {
      label: 'HAD',
      kind: 'ecu',
    },
    position: {x: 0, y: 0},
    width: 160,
    height: 80,
  },
  {
    id: 'ADAS',
    data: {
      label: 'ADAS',
      kind: 'ecu',
    },
    position: {x: 0, y: 0},
    width: 160,
    height: 80,
  },
];

export const initialEdges: Edge[] = [
  {
    id: 'IVI_CANFD-NE-ZCUR',
    source: 'IVI_CANFD',
    target: 'ZCUR',
    type: EdgeType.floatingEdge,
    data: {
      parentNetwork: 'CANFD',
      direction: 'networkgateway',
    },
  },
  {
    id: 'IVI_CANFD-NE-IVI',
    source: 'IVI_CANFD',
    target: 'IVI',
    type: EdgeType.floatingEdge,
    data: {
      parentNetwork: 'CANFD',
      direction: 'networkecu',
    },
  },
  {
    id: 'ECANFD-NE-ZCUR',
    source: 'ECANFD',
    target: 'ZCUR',
    type: EdgeType.floatingEdge,
    data: {
      parentNetwork: 'CANFD',
      direction: 'networkgateway',
    },
  },
  {
    id: 'ECANFD-NE-PDCU',
    source: 'ECANFD',
    target: 'PDCU',
    type: EdgeType.floatingEdge,

    data: {
      parentNetwork: 'CANFD',
      direction: 'networkgateway',
    },
  },
  {
    id: 'ECANFD-NE-ICD',
    source: 'ECANFD',
    target: 'ICD',
    type: EdgeType.floatingEdge,

    data: {
      parentNetwork: 'CANFD',
      direction: 'networkecu',
    },
  },
  {
    id: 'MCANFD-NE-PDCU',
    source: 'MCANFD',
    target: 'PDCU',
    type: EdgeType.floatingEdge,
    data: {
      parentNetwork: 'CANFD',
      direction: 'networkgateway',
    },
  },
  {
    id: 'MCANFD-NE-EMS',
    source: 'MCANFD',
    target: 'EMS',
    type: EdgeType.floatingEdge,
    data: {
      parentNetwork: 'CANFD',
      direction: 'networkecu',
    },
  },
  {
    id: 'CCANFD-NE-ZCUR',
    source: 'CCANFD',
    target: 'ZCUR',
    type: EdgeType.floatingEdge,
    data: {
      parentNetwork: 'CANFD',
      direction: 'networkgateway',
    },
  },
  {
    id: 'CCANFD-NE-IBC',
    source: 'CCANFD',
    target: 'IBC',
    type: EdgeType.floatingEdge,
    data: {
      parentNetwork: 'CANFD',
      direction: 'networkecu',
    },
  },
  {
    id: 'CCANFD-NE-HAD',
    source: 'CCANFD',
    target: 'HAD',
    type: EdgeType.floatingEdge,
    data: {
      parentNetwork: 'CANFD',
      direction: 'networkecu',
    },
  },
  {
    id: 'CCANFD-NE-ADAS',
    source: 'CCANFD',
    target: 'ADAS',
    type: EdgeType.floatingEdge,
    data: {
      parentNetwork: 'CANFD',
      direction: 'networkecu',
    },
  },
];

// 点之间的连线关系
export const routes = [
  [
    {
      name: 'EMS',
      kind: 'ecu',
      direction: 'tx',
      network: 'MCANFD',
    },
    {
      name: 'MCANFD',
    },
    {
      name: 'PDCU',
      kind: 'gateway',
      direction: 'rx',
      network: 'MCANFD',
    },
    {
      name: 'ECANFD',
    },
    {
      name: 'ICD',
      kind: 'ecu',
      direction: 'rx',
      network: 'ECANFD',
    },
  ],
  [
    {
      name: 'EMS',
      kind: 'ecu',
      direction: 'tx',
      network: 'MCANFD',
    },
    {
      name: 'MCANFD',
    },
    {
      name: 'PDCU',
      kind: 'gateway',
      direction: 'rx',
      network: 'MCANFD',
    },
    {
      name: 'ECANFD',
    },
    {
      name: 'ZCUR',
      kind: 'gateway',
      direction: 'rx',
      network: 'ECANFD',
    },
    {
      name: 'IVI_CANFD',
    },
    {
      name: 'IVI',
      kind: 'ecu',
      direction: 'rx',
      network: 'IVI_CANFD',
    },
  ],
  [
    {
      name: 'EMS',
      kind: 'ecu',
      direction: 'tx',
      network: 'MCANFD',
    },
    {
      name: 'MCANFD',
    },
    {
      name: 'PDCU',
      kind: 'gateway',
      direction: 'rx',
      network: 'MCANFD',
    },
    {
      name: 'ECANFD',
    },
    {
      name: 'ZCUR',
      kind: 'gateway',
      direction: 'rx',
      network: 'ECANFD',
    },
    {
      name: 'CCANFD',
    },
    {
      name: 'IBC',
      kind: 'ecu',
      direction: 'rx',
      network: 'CCANFD',
    },
  ],
];
export const edgeSeparator = '-NE-';
