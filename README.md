![Redonk logo](https://github.com/dusanjovanov/redonk/blob/master/logo.png 'Redonk logo')

🎉 Ridiculously simple state management in pure React
<br />
<br />

[![npm](https://img.shields.io/npm/v/redonk?color=%231E90FF&label=npm&style=for-the-badge)](https://www.npmjs.com/package/redonk)

<br />

[Example demo with Counter and Todos](https://codesandbox.io/s/redonk-example-5gmjmx)

## **Installation**

```bash
npm install redonk
```

```bash
yarn add redonk
```

## **Highlights**

- Pure React state and context
- Light - around 760B in production
- Can be used for both global state and simpler cases when you just need to "lift up" your state
- Solves performance issues of context by creating multiple contexts and passing slices of state to them
- Full Typescript support

## **Usage**

1. Create the store

```tsx
// store.jsx
export const {
  Provider,
  useSliceState,
  useActions,
  useRedonkState,
} = createStore({
  slices: {
    count: 0,
    todos: {
      items: [{ id: '1', text: 'Learn React', isDone: false }],
    },
  },
  reducers: {
    increment: state => {
      return {
        ...state,
        count: state.count + 1,
      };
    },
    decrement: state => {
      return {
        ...state,
        count: state.count - 1,
      };
    },
    addTodo: (state, todo) => {
      return {
        ...state,
        todos: {
          ...state.todos,
          items: [...state.todos.items, todo],
        },
      };
    },
  },
});
```

2. Wrap your component tree with the returned **Provider**

```tsx
// app.jsx
import { Provider } from './store';
import { Counter } from './Counter';
import { Todos } from './Todos';

const App = () => {
  return (
    <Provider>
      <Counter />
      <Todos />
    </Provider>
  );
};
```

3. And just use your state, actions and computed fields !!! 🥳

```tsx
  // counter.jsx
  import {useSliceState, useActions } from "./store"

  export const Counter = () => {
    const count = useSliceState("count")
    const {increment, decrement} = useActions()

    return (
      <div>
        <button onClick={decrement}>-</button>
        <div>{count}</count>
        <button onClick={increment}>+</button>
      </div>
    )
  }

  // todos.jsx

  import {useSliceState, useActions} from "./store"

  export const Todos = () => {
    const {items: todos} = useSliceState("todos")
    const {addTodo} = useActions()

    return (
      <div>
        <ul>
          {todos.map(todo => (
            <li key={todo.id}>
              {todo.text}
              {todo.isDone && "✅"}
            </li>
          ))}
        </ul>
        <button onClick={() =>
          addTodo({
            id: Date.now().toString(),
            text: "New todo",
            isDone: false
          })}>
          Add todo
        </button>
      </div>
    )
  }
```

## **API**

The library only exports one function!

### `createStore({ slices, reducers }) => { Provider, useSliceState, useActions, useRedonkState }`

```tsx
import { createStore } from 'redonk';

const { Provider, useSliceState, useActions, useRedonkState } = createStore({
  slices: {
    count: 0,
  },
  reducers: {
    increment: state => {
      return {
        ...state,
        count: state.count + 1,
      };
    },
    decrement: state => {
      return {
        ...state,
        count: state.count - 1,
      };
    },
  },
});
```

## Accepts

### `slices`

An object that defines how the state will be split into contexts.

A slice can be any value (primitive or object)

In this example we will have two state contexts, one for `counter` and the other for `todos`:

```tsx
createStore({
  slices: {
    counter: {
      count: 0,
    },
    todos: {
      items: [],
      filter: 'all',
    },
  },
});
```

### `reducers`

An object with your case reducers. A case reducer is a function that accepts two arguments: `state` and `payload` and should return the new `state`.
For each of the case reducers a corresponding action will be created with the same name.

## Returns

### `Provider`

Holds the state, actions and renders all of the contexts. You need to wrap your component tree with it:

```tsx
return (
  <Provider>
    {...}
  </Provider>
)
```

### `useSliceState(sliceKey: string)`

Returns the state of the slice whose key you passed in. Only causes a render if you update that slice.

```tsx
const counterState = useSliceState('counter');
```

### `useActions()`

Returns all of the actions. Never causes a render because `actions` are memoized.

```tsx
const actions = useActions();
```

### `useRedonkState: () => State`

Hook for getting the entire state of Redonk. Causes a render on every state update, so use wisely!

```tsx
const entireState = useRedonkState();
```

---

## **Usage with Typescript**

When creating the store, you should define the type of your state:

```tsx
import { createStore } from 'redonk';

type Todo = {
  id: string;
  text: string;
  isDone: boolean;
};

type AppState = {
  counter: {
    count: number;
  };
  todos: {
    items: Todo[];
  };
};

// like this
createStore({
  slices: {
    counter: {
      count: 0,
    },
    todos: {
      items: [],
    },
  } as AppState,
});

// or like this
const slices: AppState = {
  counter: {
    count: 0,
  },
  todos: {
    items: [],
  },
};

createStore({
  slices,
});
```

You also need to define the type of the payload for each case reducer:

```tsx
createStore({
  slices: {
    counter: {
      count: 0,
    },
  },
  reducers: {
    // you can name the payload argument anything you want
    incrementByAmount: (state, payload: number) => {
      return {
        ...state,
        counter: {
          ...state.counter,
          count: state.counter.count + payload,
        },
      };
    },
  },
});
```

And voila! You have intellisense everywhere:

```tsx
// inside component
const counterState = useSliceState('counter'); // counter state is correctly inferred as { count: number }

const actions = useActions(); // actions are correctly inferred including the type of Payload

const entireState = useRedonkState(); // correctly inferred as AppState
```
