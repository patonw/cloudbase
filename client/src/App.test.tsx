import React from 'react';
import { shallow } from 'enzyme'

import ConnectedApp, { App } from './App';
import * as act from './store/actions'

it('renders without crashing', () => {
  const clearError = jest.fn(() => act.clearError())
  const app = shallow(<App uuid={"theUUID"} clearError={clearError}/>);
  expect(app).toMatchSnapshot()
});
