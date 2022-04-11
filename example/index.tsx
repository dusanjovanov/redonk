import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ActionArgs, createStore } from '../.';

type State = {
  count: number;
};

const { Provider, useModelState, useActions } = createStore({
  models: {
    count: 0,
  } as State,
  actions: {
    increment: ({ set }: ActionArgs<State>) => {
      set('count', s => s + 1);
    },
  },
});

const Counter = () => {
  const count = useModelState('count');
  const { increment } = useActions();

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={increment}>+</button>
    </div>
  );
};

const App = () => {
  return (
    <Provider>
      <Counter />
    </Provider>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
