import * as React from 'react';
import { useSliceState, useActions } from './store';

const CounterAddAmount = React.memo(() => {
  const [state, setState] = React.useState('0');
  const { incrementByAmount } = useActions();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input
        type="number"
        value={state}
        onChange={e => setState(e.target.value)}
        style={{ width: 300 }}
      />
      <button
        onClick={async () => {
          const parsedNumber = parseFloat(state);
          incrementByAmount(isNaN(parsedNumber) ? 0 : parsedNumber);
        }}
      >
        Add amount
      </button>
    </div>
  );
});

const CounterButtons = () => {
  const { increment, decrement } = useActions();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <button
        style={{ marginBottom: 10, display: 'block', width: '100%' }}
        onClick={decrement}
      >
        -
      </button>
      <button onClick={increment}>+</button>
    </div>
  );
};

const Count = () => {
  const { count } = useSliceState('counter');

  return (
    <div
      style={{
        textAlign: 'center',
        fontSize: '2rem',
        padding: '0.2rem 1rem',
      }}
    >
      {count}
    </div>
  );
};

const Counter = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: '1rem',
        gap: 100,
      }}
    >
      <CounterButtons />
      <Count />
    </div>
  );
};

export const CounterExample = () => {
  const { resetCounter } = useActions();

  return (
    <div>
      <h1 style={{ margin: 0, marginBottom: '1rem' }}>Counter</h1>
      <Counter />
      <div style={{ marginBottom: '1rem' }}>
        <CounterAddAmount />
      </div>
      <button onClick={resetCounter}>Reset</button>
    </div>
  );
};
