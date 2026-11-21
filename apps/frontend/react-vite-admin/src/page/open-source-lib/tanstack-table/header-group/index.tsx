import {useMemo, useState} from 'react';
import {createColumnHelper, flexRender, getCoreRowModel, useReactTable} from '@tanstack/react-table';
import {Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow} from '@badnpm/ui';
import {makeData, type Person} from '../tool';

const columnHelper = createColumnHelper<Person>();

export default function HeaderGroupTable() {
  const [data, _setData] = useState(() => makeData(10));
  const columns = useMemo(() => {
    return [
      columnHelper.group({
        id: 'hello',
        header: () => <span>Hello</span>,
        // footer: props => props.column.id,
        columns: [
          columnHelper.accessor('firstName', {
            cell: (info) => info.getValue(),
            footer: (props) => props.column.id,
          }),
          columnHelper.accessor((row) => row.lastName, {
            id: 'lastName', // 必须给id
            cell: (info) => info.getValue(),
            header: () => <span>Last Name</span>,
            footer: (props) => props.column.id,
          }),
        ],
      }),
      columnHelper.group({
        header: 'Info',
        footer: (props) => props.column.id,
        columns: [
          columnHelper.accessor('age', {
            header: () => 'Age',
            footer: (props) => props.column.id,
          }),
          columnHelper.group({
            header: 'More Info',
            footer: (props) => props.column.id + ' footer',
            columns: [
              columnHelper.accessor('status', {
                header: 'Status',
                footer: (props) => props.column.id,
              }),
              columnHelper.accessor('email', {
                header: 'Email',
                footer: (props) => props.column.id,
              }),
              columnHelper.accessor('progress', {
                header: 'Profile Progress',
                footer: (props) => props.column.id,
              }),
            ],
          }),
        ],
      }),
    ];
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div>
      <Table className="border-collapse border-1">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead className="border-1" key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell className="border-1" key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          {table.getFooterGroups().map((footerGroup) => (
            <TableRow key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <TableHead className="border-1" key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.footer, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableFooter>
      </Table>
    </div>
  );
}
