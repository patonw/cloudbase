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
}

export interface Cell {
  uuid: UUID,
  worksheet: UUID,
  lang: string,
  script: string,
  result: any
}

export interface CodeCell extends Cell {
}

export interface GraphCell extends Cell {
}