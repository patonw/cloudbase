import * as gql from './graphql'
import { CodeCell, GraphCell } from './types'

it('is all good', () => {
  1+ 1
})

it('generates a TOC query', () => {
  const query = gql.loadTOC()
  expect(query).toMatchSnapshot()
})

it('generates a worksheet query', () => {
  const query = gql.loadWorksheet('helloWorld')
  expect(query).toMatchSnapshot()
})

it('generates a combined update and execute mutation for a code cell', () => {
  const dirty: CodeCell =  {
    uuid: 'theCellId',
    lang: 'kotlin',
    worksheet: 'theWorksheetId',
    script: `1+1`,
  }
  const query = gql.executeCell('thePID', 'theCellId', dirty)
  expect(query).toMatchSnapshot()
})


it('generates a combined update and execute mutation for a graph cell', () => {
  const dirty: GraphCell =  {
    uuid: 'theCellId',
    lang: 'kotlin',
    worksheet: 'theWorksheetId',
    script: `1+1`,
    spec: `
    {
      "$schema": "https://vega.github.io/schema/vega-lite/v3.json",
      "description": "A simple bar chart with embedded data.",
      "mark": "bar",
      "encoding": {
        "x": {"field": "first", "type": "ordinal"},
        "y": {"field": "second", "type": "quantitative"}
      }
    }`
  }
  const query = gql.executeCell('thePID', 'theCellId', dirty)
  expect(query).toMatchSnapshot()
})

it('only executes a clean cell without updating', () => {
  const query = gql.executeCell('thePID', 'theCellID')
  expect(query).toMatchSnapshot()
})

it('inserts a code cell', () => {
  const query = gql.insertCell('theCellID', undefined, 'CODE')
  expect(query).toMatchSnapshot()
})

it('inserts a graph cell', () => {
  const query = gql.insertGraphCell('theCellID', 5)
  expect(query).toMatchSnapshot()
})

it('deletes a cell', () => {
  const query = gql.deleteCell('theSheetID', 'theCellID')
  expect(query).toMatchSnapshot()
})

it('creates a new worksheet', () => {
  const query = gql.createWorksheet('theWorkbook', "Hello Worksheet")
  expect(query).toMatchSnapshot()
})

it('creates a new process', () => {
  const query = gql.createProcess('theWorksheet')
  expect(query).toMatchSnapshot()
})