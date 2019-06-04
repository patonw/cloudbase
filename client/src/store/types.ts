export type UUID = string

export interface Workbook {
  uuid: UUID,
  name: string,
  sheets: UUID[],
}

export interface Worksheet {
  uuid: UUID,
  workbook: UUID,
  name: string,
  cells: UUID[],
  modified?: number,
  process?: UUID,
}

export interface CellResult {
  progress?: number
  data?: string
  json?: () => any
  error?: any
}

export interface CodeCell {
  uuid: UUID,
  worksheet: UUID,
  lang: string,
  script: string,
}

export interface GraphCell extends CodeCell {
  spec: string
}

export type Cell = CodeCell | GraphCell

export function isGraphCell(cell: Cell): cell is GraphCell {
  return (cell as GraphCell).spec !== undefined
}

