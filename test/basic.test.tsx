import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { createStore } from '../src';
import '@testing-library/jest-dom';

const { Provider, useSliceState, useActions } = createStore({
  slices: {
    count: 0,
  },
  reducers: {
    setCount: (state, payload: number) => {
      return {
        ...state,
        count: payload,
      };
    },
  },
});

const Counter = () => {
  const count = useSliceState('count');
  const { setCount } = useActions();

  return (
    <div>
      <div data-testid="count">{count}</div>
      <button data-testid="plus" onClick={() => setCount(count + 1)}>
        +
      </button>
    </div>
  );
};

test('count', () => {
  render(
    <Provider>
      <Counter />
    </Provider>
  );

  const count = screen.getByTestId('count');

  expect(count).toHaveTextContent('0');
});

test('plus 1', () => {
  render(
    <Provider>
      <Counter />
    </Provider>
  );

  const count = screen.getByTestId('count');
  const btn = screen.getByTestId('plus');

  fireEvent.click(btn);

  expect(count).toHaveTextContent('1');
});
