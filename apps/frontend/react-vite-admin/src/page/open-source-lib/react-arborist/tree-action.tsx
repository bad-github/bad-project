import {Button, Input, Label, Checkbox, BadTooltip} from '@badnpm/ui';
import React, {useMemo} from 'react';
import {TreeApi} from 'react-arborist';
import IconQuestion from '@/assets/svg/circle-question-mark.svg?react';
import type {TAddressItem} from './index';
import {useTranslation} from 'react-i18next';

type TProps = {
  focusedData: TAddressItem | null;
  selectData: TAddressItem[];
  activeData: TAddressItem | null;
  treeData: TAddressItem[];
  setTreeData: React.Dispatch<React.SetStateAction<TAddressItem[]>>;
  treeApiRef: React.RefObject<TreeApi<TAddressItem> | null>;
  setSelection: React.Dispatch<React.SetStateAction<string>>;
  showAction: boolean;
  setShowAction: React.Dispatch<React.SetStateAction<boolean>>;
  showLine: boolean;
  setShowLine: React.Dispatch<React.SetStateAction<boolean>>;
  showIcon: boolean;
  setShowIcon: React.Dispatch<React.SetStateAction<boolean>>;
  disableMultiSelection: boolean;
  setDisableMultiSelection: React.Dispatch<React.SetStateAction<boolean>>;
  selectionFollowsFocus: boolean;
  setSelectionFollowsFocus: React.Dispatch<React.SetStateAction<boolean>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  openByDefault: boolean;
  setOpenByDefault: React.Dispatch<React.SetStateAction<boolean>>;
  setRefreshKey: React.Dispatch<React.SetStateAction<string>>;
};

export default function TreeAction(props: TProps) {
  const {t} = useTranslation();
  const {
    focusedData,
    activeData,
    selectData,
    treeData,
    setTreeData,
    treeApiRef,
    setSelection: _setSelection,
    showLine,
    setShowLine,
    showAction,
    setShowAction,
    showIcon,
    setShowIcon,
    disableMultiSelection,
    setDisableMultiSelection,
    selectionFollowsFocus,
    setSelectionFollowsFocus,
    searchTerm,
    setSearchTerm,
    openByDefault,
    setOpenByDefault,
    setRefreshKey: _setRefreshKey,
  } = props;

  const firstNodeData = useMemo(() => {
    // eslint-disable-next-line react-hooks/refs
    return treeData?.[0] || treeApiRef.current?.firstNode?.data;
  }, [treeData]);

  const handleSelectOne = () => {
    // 需要和取消选中的方法对应，建议使用select api。然后使用 treeApiRef.current?.selectedIds 或 treeApiRef.current?.selectedNodes 获取
    treeApiRef.current?.select(firstNodeData?.id);
    // 或
    // setSelection(firstNodeData?.id || '');
  };

  const handleDeselectOne = () => {
    treeApiRef.current?.deselect(firstNodeData?.id);
    // 或
    // setSelection('');
  };
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-4 py-2 [&>*]:flex [&>*]:flex-wrap [&>*]:gap-1">
      {/*  <div>
        <h4 className="basis-full scroll-m-20 text-base font-semibold tracking-tight">销毁</h4>
        <Button variant="outline" onClick={() => setRefreshKey(Date.now().toString())}>
          重新加载树组件
          <BadTooltip
            trigger={{
              asChild: true,
              children: (
                  <IconQuestion className="size-4" />
              )
            }}
            content={{children: '切换状态中的：是否默认全展开，但是发现 openByDefault 在初始化后也受控'}}
          />
        </Button>
      </div> */}
      <div>
        <h4 className="basis-full scroll-m-20 text-base font-semibold tracking-tight">{t('lib.filter')}</h4>
        <Input
          className="h-8 w-full"
          placeholder={t('form.placeholderE')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="[&>*:not(h4)]:rounded-md [&>*:not(h4)]:border-1 [&>*:not(h4)]:p-2">
        <h4 className="basis-full scroll-m-20 text-base font-semibold tracking-tight">{t('lib.state')}</h4>
        <Label>
          <Checkbox checked={showLine} onCheckedChange={(checked: boolean) => setShowLine(checked)} />
          {t('lib.showLine')}
        </Label>
        <Label>
          <Checkbox checked={showAction} onCheckedChange={(checked: boolean) => setShowAction(checked)} />
          {t('lib.showAction')}
        </Label>
        <Label>
          <Checkbox checked={showIcon} onCheckedChange={(checked: boolean) => setShowIcon(checked)} />
          {t('lib.showIcon')}
        </Label>
        <Label>
          <Checkbox checked={openByDefault} onCheckedChange={(checked: boolean) => setOpenByDefault(checked)} />
          {t('lib.expandAllByDefault')}
        </Label>
        <Label>
          <Checkbox
            onCheckedChange={(checked) => {
              setTreeData(
                treeData.map((v, index) => {
                  return {
                    ...v,
                    isReadonly: checked ? index === 0 : false,
                  };
                })
              );
            }}
          />
          {t('lib.disableFirstNode')}
        </Label>
        <Label>
          <Checkbox
            checked={disableMultiSelection}
            onCheckedChange={(checked: boolean) => setDisableMultiSelection(checked)}
          />
          {t('lib.disable/enableMultipleSelection')}
        </Label>
        <Label>
          <Checkbox
            checked={selectionFollowsFocus}
            onCheckedChange={(checked: boolean) => setSelectionFollowsFocus(checked)}
          />
          {t('lib.selectionFollowsFocus')}
          <BadTooltip
            trigger={{
              render: <IconQuestion className="size-4" />,
            }}
            content={{children: t('lib.singleSelectArrow')}}
          />
        </Label>
      </div>
      <div>
        <h4 className="basis-full scroll-m-20 text-base font-semibold tracking-tight">{t('lib.selection')}</h4>
        <Button variant="outline" onClick={handleSelectOne}>
          {t('lib.selectFirst')}
          <BadTooltip
            trigger={{
              render: (
                <span>
                  <IconQuestion />
                </span>
              ),
            }}
            content={{children: t('lib.multiSelectNode')}}
          />
        </Button>
        <Button variant="outline" onClick={handleDeselectOne}>
          {t('lib.deselectFirst')}
        </Button>
        <Button variant="outline" onClick={() => treeApiRef.current?.selectAll()}>
          {t('lib.selectAll')}
        </Button>
        <Button variant="outline" onClick={() => treeApiRef.current?.deselectAll()}>
          {t('lib.clearAll')}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            console.log(
              treeApiRef.current?.selectedIds?.size,
              treeApiRef.current?.selectedNodes.map((v) => v.data.name)
            );
          }}
        >
          {t('lib.selection')}
          <BadTooltip
            trigger={{
              render: (
                <span>
                  <IconQuestion />
                </span>
              ),
            }}
            content={{children: t('lib.shiftMultiSelect')}}
          />
          : {selectData?.length === 1 ? selectData[0].name : selectData.length}
        </Button>
      </div>
      <div>
        <h4 className="basis-full scroll-m-20 text-base font-semibold tracking-tight"> {t('lib.focused')}</h4>
        <Button variant="outline">
          {t('lib.focused')}
          <BadTooltip
            trigger={{
              render: (
                <span>
                  <IconQuestion />
                </span>
              ),
            }}
            content={{children: t('lib.useArrowKeys')}}
          />
          : {focusedData?.name}
        </Button>
        <Button
          variant="outline"
          onClick={() => firstNodeData?.id && treeApiRef.current?.focus(firstNodeData?.id, {scroll: true})}
        >
          {t('lib.focusFirst')}
          <BadTooltip
            trigger={{
              render: (
                <span>
                  <IconQuestion />
                </span>
              ),
            }}
            content={{children: t('lib.singleFocus')}}
          />
        </Button>
      </div>
      <div>
        <h4 className="basis-full scroll-m-20 text-base font-semibold tracking-tight">{t('lib.activated')}</h4>
        <Button variant="outline">
          {t('lib.activated')}: {activeData?.name}
        </Button>
        <Button variant="outline" onClick={() => firstNodeData?.id && treeApiRef.current?.activate(firstNodeData?.id)}>
          {t('lib.activateFirst')}
          <BadTooltip
            trigger={{
              render: (
                <span>
                  <IconQuestion />
                </span>
              ),
            }}
            content={{children: t('lib.statelessInfo')}}
          />
        </Button>
      </div>
      <div>
        <h4 className="basis-full scroll-m-20 text-base font-semibold tracking-tight">
          {t('lib.expand')}/{t('lib.collapse')}
        </h4>
        <Button variant="outline" onClick={() => firstNodeData?.id && treeApiRef.current?.open(firstNodeData?.id)}>
          {t('lib.expandFirst')}
          <BadTooltip
            trigger={{
              render: (
                <span>
                  <IconQuestion />
                </span>
              ),
            }}
            content={{children: t('lib.expandWithSpace')}}
          />
        </Button>
        <Button variant="outline" onClick={() => treeApiRef.current?.openAll()}>
          {t('lib.expandAll')}
        </Button>
        <Button variant="outline" onClick={() => firstNodeData?.id && treeApiRef.current?.close(firstNodeData?.id)}>
          {t('lib.collapseFirst')}
          <BadTooltip
            trigger={{
              render: (
                <span>
                  <IconQuestion />
                </span>
              ),
            }}
            content={{children: t('lib.collapseWithSpace')}}
          />
        </Button>
        <Button variant="outline" onClick={() => treeApiRef.current?.closeAll()}>
          {t('lib.collapseAll')}
        </Button>
      </div>
      <div>
        <h4 className="basis-full scroll-m-20 text-base font-semibold tracking-tight">{t('lib.event')}</h4>
        <Button
          variant="outline"
          onClick={() => treeApiRef.current?.create({parentId: firstNodeData?.id, type: 'leaf', index: 0})}
        >
          {t('lib.createFileAtFirst')}
          <BadTooltip
            trigger={{
              render: (
                <span>
                  <IconQuestion />
                </span>
              ),
            }}
            content={{children: t('lib.createUnderParent') + t('lib.supportsAsync')}}
          />
        </Button>
        <Button
          variant="outline"
          onClick={() => treeApiRef.current?.create({parentId: firstNodeData?.id, type: 'internal', index: 0})}
        >
          {t('lib.createFolderAtFirst')}
          <BadTooltip
            trigger={{
              render: (
                <span>
                  <IconQuestion />
                </span>
              ),
            }}
            content={{children: t('lib.createAtSameLevel') + t('lib.supportsAsync')}}
          />
        </Button>
        <Button variant="outline" onClick={() => treeApiRef.current?.edit(firstNodeData?.id)}>
          {t('lib.editFirstNode')}
          <BadTooltip
            trigger={{
              render: (
                <span>
                  <IconQuestion />
                </span>
              ),
            }}
            content={{children: t('lib.editFocused') + t('lib.supportsAsync')}}
          />
        </Button>
        {/* 支持批量删除 */}
        <Button variant="outline" onClick={() => treeApiRef.current?.delete([firstNodeData?.id])}>
          {t('lib.deleteFirstNode')}
          <BadTooltip
            trigger={{
              render: (
                <span>
                  <IconQuestion />
                </span>
              ),
            }}
            content={{children: t('lib.deleteSelected') + t('lib.supportsAsync')}}
          />
        </Button>
        <Button variant="outline" onClick={() => treeApiRef.current?.scrollTo(firstNodeData?.id)}>
          {t('lib.scrollToFirstNode')}
        </Button>
        <Button variant="outline" onClick={() => treeApiRef.current?.delete([firstNodeData?.id])}>
          {t('lib.dragAndDrop')}
          <BadTooltip
            trigger={{
              render: (
                <span>
                  <IconQuestion />
                </span>
              ),
            }}
            content={{children: t('lib.dragDisabled')}}
          />
        </Button>
      </div>
    </div>
  );
}
