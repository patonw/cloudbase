import * as act from './actions'

it('clears error messages', () =>{
  const action = act.clearError()
  expect(action).toMatchSnapshot()
})

it('loads the table of contents', () => {
  const pending = act.loadToc()
  expect(pending).toMatchSnapshot()

  const success = act.loadToc(act.AsyncStatus.Success)
  expect(success).toMatchSnapshot()
})

it('creates a new worksheet', () => {
  const pending = act.createWorksheet('theWorkbook', 'Worksheet Name')
  expect(pending).toMatchSnapshot()
  const success = act.createWorksheet('theWorkbook', 'Worksheet Name', 'theWorksheetId', act.AsyncStatus.Success)
  expect(success).toMatchSnapshot()
})