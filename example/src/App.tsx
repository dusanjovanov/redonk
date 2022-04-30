import React from 'react';
import { Provider } from './store';
import { Todos } from './todos';
import { CounterExample } from './counter';

function App() {
  return (
    <Provider>
      <div>
        <CounterExample />
        <Todos />
      </div>
    </Provider>
  );
}

export default App;
