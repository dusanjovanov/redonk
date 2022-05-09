import React from 'react';
import { CounterExample } from './counter';
import { Provider } from './store';
import { Todos } from './todos';

function App() {
  return (
    <Provider>
      <CounterExample />
      <Todos />
    </Provider>
  );
}

export default App;
