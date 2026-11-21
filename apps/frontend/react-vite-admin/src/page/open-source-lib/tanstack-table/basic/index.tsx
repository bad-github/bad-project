import {useTranslation} from 'react-i18next';
import {LoadingOverlay} from '@badnpm/ui';
import {Button} from '@badnpm/ui';
import {useMemo, useState} from 'react';
import {createColumnHelper} from '@tanstack/react-table';
import ExpandCell from '@/components/tanstack/expand-cell';
import TanstackTable from '@/components/tanstack/tanstack-table-div';
import {makeData, type Person} from '../tool';

const columnHelper = createColumnHelper<Person>();

export default function BasicTable() {
  const {t} = useTranslation();
  const defaultData = makeData(100, 2);
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(false);

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('firstName', {
        cell: (cellProps) => <ExpandCell {...cellProps} />,
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor((row) => row.lastName, {
        id: 'lastName',
        cell: (info) => info.getValue(),
        header: () => <span>Last Name</span>,
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor((row) => row.lastName, {
        id: 'email',
        cell: (info) => <>{info.getValue()}</>,
        header: () => <span>Email</span>,
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor('age', {
        header: () => 'Age',
        cell: (info) => info.renderValue(),
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor('gender', {
        header: () => 'Gender',
        cell: (info) => info.renderValue(),
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor('progress', {
        header: 'Progress',
        footer: (info) => info.column.id,
      }),
    ];
  }, []);

  return (
    <div>
      <div className="flex gap-2 pb-2">
        <Button
          onClick={() => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
            }, 2000);
          }}
        >
          加载中
        </Button>
        <Button onClick={() => setData([])}>空数据</Button>
        <Button onClick={() => setData([...defaultData])}>恢复数据</Button>
      </div>
      <h2>Normal Table</h2>
      <LoadingOverlay text={t('common.loading')} loading={loading} type="component">
        <TanstackTable columns={columns} data={data} style={{height: 200}} />
      </LoadingOverlay>
      <br />
      <h2>Virtual Table</h2>
      <LoadingOverlay text={t('common.loading')} loading={loading} type="component">
        <TanstackTable columns={columns} data={data} virtual />
      </LoadingOverlay>
    </div>
  );
}
