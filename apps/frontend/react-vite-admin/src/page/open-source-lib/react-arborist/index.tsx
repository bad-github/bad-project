import {getMock} from '@/mock';
import {useTranslation} from 'react-i18next';
import {LoadingOverlay} from '@badnpm/ui';
import {toast} from '@badnpm/ui';
import {useEffect, useRef, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {TreeApi} from 'react-arborist';
import {useMeasure} from 'react-use';

import TreeAction from './tree-action';
import {time} from '@workspace/utils';
import {ReactTree} from '@/components/react-tree';
// import './index.css';

export type TAddressItem = {
  name: string;
  id: string;
  isReadonly?: boolean;
  children?: TAddressItem[];
  // icon?: React.ComponentType<any>; // 更简单定义方式
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>> | React.ComponentType<any>;
};

export default function ReactArborist() {
  const {t} = useTranslation();
  const [wrapperRef, {height = 400}] = useMeasure<HTMLDivElement>();
  const treeApiRef = useRef<TreeApi<TAddressItem> | null>(null);
  const [focusedData, setFocusedData] = useState<TAddressItem | null>(null);
  const [selectData, setSelectData] = useState<TAddressItem[]>([]);
  const [activeData, setActiveData] = useState<TAddressItem | null>(null);
  const [_selection, setSelection] = useState<string>('');
  const [_creatingNodeId, setCreatingNodeId] = useState<string>('');
  const [showAction, setShowAction] = useState<boolean>(false);
  const [disableMultiSelection, setDisableMultiSelection] = useState<boolean>(true);
  const [selectionFollowsFocus, setSelectionFollowsFocus] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [_refreshKey, setRefreshKey] = useState<string>(() => Date.now().toString());
  const [openByDefault, setOpenByDefault] = useState<boolean>(true);
  const [showLine, setShowLine] = useState<boolean>(true);
  const [showIcon, setShowIcon] = useState<boolean>(true);
  const {data, isFetching, isError, error} = useQuery<TAddressItem[]>({
    queryKey: ['address'],
    retry: 0,
    queryFn: async () => {
      await time.sleep({}, 1000);
      console.log('first');
      return (await getMock()).address.getTree();
    },
  });
  const [treeData, setTreeData] = useState<TAddressItem[] | null>(null);
  /**
   * controller包含的方法默认就会改变treeData
   */
  useEffect(() => {
    if (isError) {
      toast.add({title: error?.message, type: 'error'});
    }
  }, [isError, error]);

  const finalTreeData = treeData ?? data ?? [];

  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1" ref={wrapperRef}>
        <LoadingOverlay text={t('common.loading')} loading={isFetching} className="h-full">
          <ReactTree<TAddressItem>
            height={height || 400}
            className="border"
            ref={treeApiRef}
            data={finalTreeData}
            openByDefault={openByDefault}
            searchTerm={searchTerm}
            disableMultiSelection={disableMultiSelection}
            selectionFollowsFocus={selectionFollowsFocus}
            showIcon={showIcon}
            showAction={showAction}
            showLine={showLine}
            setCreatingNodeId={setCreatingNodeId}
            setSelectData={setSelectData}
            setFocusedData={setFocusedData}
            setActiveData={setActiveData}
          />
        </LoadingOverlay>
      </div>
      <div className="w-100 border-1">
        <TreeAction
          treeApiRef={treeApiRef}
          treeData={finalTreeData as TAddressItem[]}
          focusedData={focusedData}
          selectData={selectData}
          activeData={activeData}
          setTreeData={setTreeData as React.Dispatch<React.SetStateAction<TAddressItem[]>>}
          setSelection={setSelection}
          showAction={showAction}
          setShowAction={setShowAction}
          showLine={showLine}
          setShowLine={setShowLine}
          showIcon={showIcon}
          setShowIcon={setShowIcon}
          disableMultiSelection={disableMultiSelection}
          setDisableMultiSelection={setDisableMultiSelection}
          selectionFollowsFocus={selectionFollowsFocus}
          setSelectionFollowsFocus={setSelectionFollowsFocus}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          openByDefault={openByDefault}
          setOpenByDefault={setOpenByDefault}
          setRefreshKey={setRefreshKey}
        />
      </div>
    </div>
  );
}
