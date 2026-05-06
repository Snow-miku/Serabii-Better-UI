import * as React from "react"

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * Pokopia 列表通用 DataTable
 *
 * 把 5 个 list 页里反复抄的那套 className 抽出来：
 *   - 外层 bg-tile + lime border + overflow-x-auto
 *   - table-fixed + 内单元格 border 分隔
 *   - <colgroup> 强制列宽
 *   - thead 自动居中
 *
 * 用法：
 *   <DataTable
 *     columns={[
 *       { width: 96, header: "图标" },
 *       { width: 240, header: "名称" },
 *       { header: "描述" },
 *     ]}
 *   >
 *     {rows.map((r) => (
 *       <TableRow key={r.slug}>...</TableRow>
 *     ))}
 *   </DataTable>
 */
export interface DataTableColumn {
  /** 列宽。number 当作 px。string 当作 CSS 值 (e.g. "20%", "12rem")。undefined = 自适应 */
  width?: number | string
  /** 列头文字 */
  header?: React.ReactNode
}

export interface DataTableProps {
  columns: ReadonlyArray<DataTableColumn>
  /** TableRow 列表，由调用方自己渲染 TableCell */
  children: React.ReactNode
  /** 包一层外框的 className */
  className?: string
  /** 内部 <Table> 的 className */
  tableClassName?: string
}

export function DataTable({
  columns,
  children,
  className,
  tableClassName,
}: DataTableProps) {
  const hasHeader = columns.some((c) => c.header !== undefined)

  return (
    <div
      className={cn(
        "bg-tile border-primary overflow-x-auto border-2",
        className
      )}
    >
      <Table
        className={cn(
          "table-fixed",
          "[&_td]:border-r [&_td]:border-border/40 [&_td:last-child]:border-r-0",
          "[&_th]:border-r [&_th]:border-border/40 [&_th:last-child]:border-r-0",
          tableClassName
        )}
      >
        <colgroup>
          {columns.map((col, i) => (
            <col
              key={i}
              style={
                col.width === undefined
                  ? undefined
                  : {
                      width:
                        typeof col.width === "number"
                          ? `${col.width}px`
                          : col.width,
                    }
              }
            />
          ))}
        </colgroup>
        {hasHeader ? (
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className="text-center">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        ) : null}
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  )
}
