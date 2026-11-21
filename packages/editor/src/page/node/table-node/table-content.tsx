import {TableCellHandleMenu} from '@workspace/editor/components/tiptap-node/table-node/ui/table-cell-handle-menu';
import {TableExtendRowColumnButtons} from '@workspace/editor/components/tiptap-node/table-node/ui/table-extend-row-column-button';
import {TableHandle} from '@workspace/editor/components/tiptap-node/table-node/ui/table-handle';
import {TableSelectionOverlay} from '@workspace/editor/components/tiptap-node/table-node/ui/table-selection-overlay';
// Import required styles
import '@workspace/editor/components/tiptap-node/table-node/styles/prosemirror-table.scss';
import '@workspace/editor/components/tiptap-node/table-node/styles/table-node.scss';

export function TableNodeContent() {
  return (
    <div>
      {/* Add these components outside EditorContent for proper positioning */}
      <TableHandle />
      <TableSelectionOverlay
        showResizeHandles={true}
        cellMenu={(props) => (
          <TableCellHandleMenu editor={props.editor} onMouseDown={(e) => props.onResizeStart?.('br')(e)} />
        )}
      />
      <TableExtendRowColumnButtons />
    </div>
  );
}

export const TableNodeContentStr = `
      <h2>Table Node Demo</h2>
      <p>
        This demo shows the table functionality with all features enabled.
      </p>

      <table>
        <tbody>
          <tr>
            <th>
              <p><strong>Name</strong></p>
            </th>
            <th>
              <p><strong>Role</strong></p>
            </th>
            <th>
              <p><strong>Department</strong></p>
            </th>
          </tr>
          <tr>
            <td>
              <p>Alice Johnson</p>
            </td>
            <td>
              <p>Senior Developer</p>
            </td>
            <td>
              <p>Engineering</p>
            </td>
          </tr>
          <tr>
            <td>
              <p>Bob Smith</p>
            </td>
            <td>
              <p>Product Manager</p>
            </td>
            <td>
              <p>Product</p>
            </td>
          </tr>
          <tr>
            <td>
              <p>Carol White</p>
            </td>
            <td>
              <p>UX Designer</p>
            </td>
            <td>
              <p>Design</p>
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        You can click inside the table to see the selection overlay and resize handles. Use the extend buttons to add more rows or columns.
      </p>
    `;
