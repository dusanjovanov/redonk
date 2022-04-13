# **Redonk**

Ridiculously simple state management in pure React 🎉
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

- Pure React state and context and only around **1kB** in production (**Redux** usually adds around **17kB**)
- Good performance - optimized by splitting state into separate contexts
- Nice, structured API similar to **@reduxjs/toolkit**
- Very simple to use
- No selectors
- No thunks or other special async stuff - you can do anything with just actions
- Full Typescript support

## **Quickstart**

1. Create the store

```tsx
// store.jsx
export const {
  Provider,
  useModelState,
  useActions,
  useHookReturn,
  useRedonkState,
} = createStore({
  models: {
    count: 0,
    todos: {
      items: [{ id: '1', text: 'Learn React', isDone: false }],
    },
  },
  actions: {
    increment: ({ set }) => {
      set(state => ({ ...state, count: state.count + 1 }));
    },
    decrement: ({ set }) => {
      set(state => ({ ...state, count: state.count - 1 }));
    },
    addTodo: ({ set, payload }) => {
      set('todos', state => ({ ...state, items: [...state.items, payload] }));
    },
  },
  hooks: {
    useDoubleCount: ({ state }) => {
      return useMemo(() => {
        return state.count * 2;
      }, [state.count]);
    },
    useSomeEffect: ({ state }) => {
      useEffect(() => {
        console.log('State changed');
      }, [state]);
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
  import {useModelState, useActions, useHookReturn } from "./store"

  export const Counter = () => {
    const count = useModelState("count")
    const {increment, decrement} = useActions()
    const doubleCount = useHookReturn("useDoubleCount")

    return (
      <div>
        <button onClick={decrement}>-</button>
        <div>{count}</count>
        <button onClick={increment}>+</button>
        <div>Double count: {doubleCount}</div>
      </div>
    )
  }

  // todos.jsx

  import {useModelState, useActions} from "./store"

  export const Todos = () => {
    const {items: todos} = useModelState("todos")
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

## **Brief explanation of what happened in the quickstart**

When we called **createStore**, because we defined two models ("count", "todos"), two contexts were created to hold the values for those slices of state.
**Redonk** only has a single state inside a **useReducer**, but it solves performance issues of context by passing slices of state to separate contexts. You can subscribe to a model (or slice) of state by calling **useModelState** and passing the name of the model (ie. useModel("todos"))

Next, actions that we defined get passed in their own context and are consumed by **useActions** hook. Actions are memoized, so the actions context never updates and never causes a render.

For each hook that we defined, a context is created to pass the value of what you returned from each of the hooks. You can subscribe to the return values of hooks with **useHookReturn** by passing the name of the hook (ie. useHookReturn("useDoubleCount")).

Finally, a state context is created with the whole state passed in it, and you can get the whole state with **useRedonkState**.

## **Idea**

The idea was to create a global state management with just React state and context,
but context has performance issues when you put all your state into a single context,
and creating separate contexts manually is a lot of work.
So then, inspired by the **constate** library, we created a helper
for creating contexts and state, but gave it structure and pattern similar to **@reduxjs/toolkit**.

Differences between this and **@reduxjs/toolkit** (and **redux** in general):

- This library is pure React and only around **1kB** in production.

- There aren't any **_selectors_** - you just subscribe to the whole state of a single model, or just actions (which never change). This should be a good enough performance optimization as you often tend to use multiple fields from a single **redux** slice in your component. This also simplifies things quite a bit as you can just get the state you need without having to deal with memoization and using **reselect**.

- **_Actions_** in this library are not case reducers. They're basically just like functions that you define
  inside your component. They can update the model's state with **set**, they can be async so you can make
  API requests inside of them, and what you return from your action gets returned to the caller (component).

## **API**

The library only exports one function!

### **_createStore({ models, actions, hooks }) => { Provider, useModelState, useActions, useHookReturn, useRedonkState }_**

<br />

This function does the following things:

- Creates the state with useReducer
- Creates a state context for each of the models defined, and passes the corresponding slice of state to each of those contexts
- Creates an actions context and passes a modified version of the actions defined in it ( actions never change their ref, so this context never gets updated )
- Creates a context for each of the hooks defined which holds the value that was returned from those hooks
- Creates the Provider component which holds the state, and renders all of the contexts.
- Creates these hooks for consuming state, actions, and hook return values:
  - **useModelState** which accepts a **modelKey** to know to which model's context to subscribe to
  - **useActions** for subscribing to the actions context
  - **useHookReturn** for subscribing to the return value of a hook.
  - **useRedonkState** for subscribing to the whole Redonk state. Causes a render on every state update.

```tsx
import { createStore } from 'redonk';

const {
  Provider,
  useModelState,
  useActions,
  useHookReturn,
  useRedonkState,
} = createStore({
  models: {
    count: 0,
  },
  actions: {
    increment: ({ set }) => {
      set(state => ({ ...state, count: state.count + 1 }));
    },
    decrement: ({ set }) => {
      set(state => ({ ...state, count: state.count - 1 }));
    },
  },
  hooks: {
    useCountTimesTen: ({ state }) => {
      return useMemo(() => {
        return state.count * 10;
      }, [state.count]);
    },
  },
});
```

## _Accepts_:

### **_models_**

An object that defines how the state will be split into contexts.

A model can be any value (primitive or object)

In this example we will have two state contexts, one for _counter_ and the other for _todos_:

```tsx
createStore({
  models: {
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

### **_actions_**

An object with your actions. They will be returned to components with the same name as defined here.

Action with no payload:

```tsx
increment: ({ set }) => {
  set(state => ({ ...state, count: state.count + 1 }));
};

// inside your component:
increment();
```

Action with payload:

```tsx
incrementByAmount: ({ set, payload }) => {
  set(state => ({ ...state, count: state.count + payload }));
};

// inside your component:
incrementByAmount(3);
```

An async action:

```tsx
fetchUsers: async ({ set }) => {
  set(state => ({ ...state, isLoading: true }));
  try {
    const res = await fetch('https://someapi.com/users');
    const users = await res.json();
    set(state => ({ ...state, users, isLoading: false }));
  } catch (err) {
    set(state => ({ ...state, error: err, isLoading: false }));
  }
};

// inside your component:
fetchUsers(); // returns a Promise
```

You can return anything from an action:

```tsx
someAction: () => {
  return 3;
};

// inside your component
const someNumber = someAction();
```

### **_hooks_**

For each of these hooks, a context will be created. All of the hooks will be called on every state update, and what you return from them will be passed in their contexts.

<br />

You can use them for computed fields:

```tsx
useFilteredTodos: ({ state }) => {
  return useMemo(() => {
    return state.todos.items.filter(todo => {
      if (state.todos.filter === 'active') return !todo.isDone;
      if (state.todos.filter === 'completed') return todo.isDone;
      return true;
    });
  }, [state.todos.items, state.todos.filter]);
};

// and then in your component
const filteredTodos = useHookReturn("useFilteredTodos");

return (
  <>
    {filteredTodos.map(todo => ...)}
  </>
)
```

For effects:

```tsx
useSomeEffect: ({ state }) => {
  useEffect(() => {
    // do something when state changes
  }, [state]);
};
```

Or anything else really, be creative! 🎨

## _Action and hook args_:

### **_set: (callback: (state: State) => State) => Promise\<State\>_**

### **_set: (modelKey: string, callback: (state: ModelState) => ModelState) => Promise\<ModelState\>_**

The **set** function can be called in two ways:

- Just with the callback which accepts the whole state and expects you to return the new state.
- With a **modelKey** and a callback and then you get only that model's portion of the state in your callback and are responsible to return the new state of that model.

```tsx
models: {
  counter: {
    count: 0;
  }
}
// set with the whole state
increment: ({ set }) => {
  set(s => ({ ...s, counter: { ...s.counter, count: s.counter.count + 1 } }));
};
// set with only the counter state
increment: ({ set }) => {
  set('counter', s => ({ ...s, count: s.count + 1 }));
};
```

The set function returns a Promise which is resolved with the new state once the state has been updated so you can await it and know when the state has been updated.

Don't worry, this is completely safe. It's based on the same pattern [**useEffectReducer**](https://github.com/davidkpiano/useEffectReducer#isnt-this-unsafe) uses.

```tsx
someAction: async ({ set }) => {
  return await set(state => ({ ...state, count: 3 }));
};

// in your component
const newCount = someAction();
```

### **_getState: () => State_**

Returns the whole state.

One thing to pay attention on is that Redonk uses React state which is async so if you call **getState** right after setting the state, it will return the old state:

```tsx
models: {
  something: 2;
}
someAction: ({ set, getState }) => {
  set(s => ({ ...s, something: 3 }));
  const state = getState(); // this will return 2
};
```

If you want, you can await or attach a then callback to **set** to know when the state has been updated:

```tsx
models: {
  something: 2;
}
someAction: ({ set, getState }) => {
  set(s => ({ ...s, something: 3 })).then(() => {
    const state = getState(); // this will return 3
  });
};
```

## _Returns_:

### **_Provider_**

Holds the state, actions and renders all of the contexts. You need to wrap your component tree with it:

```tsx
return (
  <Provider>
    {...}
  </Provider>
)
```

### **_useModelState( modelKey: string )_**

Returns the state of the model whose key you passed in.

```tsx
const counterState = useModelState('counter');
```

### **_useActions()_**

Returns all of the actions.

```tsx
const actions = useActions();
```

### **_useHookReturn( hookKey: string )_**

Returns whatever you returned from the hook whose key you passed in.

```tsx
const whatWasReturnedFromThatHook = useHookReturn('thatHook');
```

### **_useRedonkState: () => State_**

Hook for getting the entire state of Redonk. Causes a render on every state update, so use wisely!

```tsx
// inside component
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
  models: {
    counter: {
      count: 0,
    },
    todos: {
      items: [],
    },
  } as AppState,
});

// or like this
const models: AppState = {
  counter: {
    count: 0,
  },
  todos: {
    items: [],
  },
};

createStore({
  models,
});
```

You also need to define the types of your action arguments including the payload:

```tsx
import { ActionArgs, createStore } from 'redonk';

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

createStore({
  actions: {
    // without payload
    increment: ({ set }: ActionArgs<AppState>) => {},
    // with payload
    // the first generic type is State, and the second generic to ActionArgs is Payload
    incrementByAmount: ({ set, payload }: ActionArgs<AppState, number>) => {},
  },
});
```

You alsooo need to define the types of the hook arguments:

```tsx
import { createStore, HookArgs } from 'redonk';

createStore({
  hooks: {
    // pass the state type to HookArgs
    useWhatever: ({ state, set }: HookArgs<AppState>) => {
      // state and set types are correctly inferred
      return Math.random();
    },
  },
});
```

And voila! You have intellisense everywhere:

```tsx
// inside component
const counterState = useModelState('counter'); // counter state is correctly inferred as { count: number }

const actions = useActions(); // actions are correctly inferred including the type of Payload

const whatWasReturnedFromUseWhatever = useHookReturn('useWhatever'); // correctly inferred as number

const entireState = useRedonkState(); // correctly inferred as AppState
```

## **Types**

```tsx
type SetStateCallback<State> = (state: State) => State;
type SetFn<State> = {
  (callback: SetStateCallback<State>): Promise<State>;
  <modelKey extends keyof State>(
    modelKey: modelKey,
    callback: SetStateCallback<State[modelKey]>
  ): Promise<State[modelKey]>;
};
type ReturnedAction<Action> = Action extends (args: infer Args) => any
  ? Args extends { payload: infer Payload }
    ? (payload: Payload) => ReturnType<Action>
    : () => ReturnType<Action>
  : any;
type ReturnedActions<Actions> = {
  [ActionName in keyof Actions]: ReturnedAction<Actions[ActionName]>;
};
type GetState<State> = () => State;
type _ActionArgs<State, Actions> = {
  set: SetFn<State>;
  actions: ReturnedActions<Actions>;
  getState: GetState<State>;
};
export type ActionArgs<
  State,
  Payload = void,
  Actions = any
> = Payload extends void
  ? _ActionArgs<State, Actions>
  : _ActionArgs<State, Actions> & {
      payload: Payload;
    };
type State<Models> = {
  [modelKey in keyof Models]: Models[modelKey];
};
export type HookArgs<State, Actions = any> = {
  state: State;
  actions: ReturnedActions<Actions>;
  set: SetFn<State>;
};
```

## **Changelog**

### v3.0.0

- 🎉 Added support for multiple hooks with separate contexts !

For every hook, a separate context is created for it's return value - so you can do different computations, and because they are passed to different contexts, you can subscribe to the result of only one hook's return value with **useHookReturn**.

⚠️ No more **useRedonkReturn** hook -> it's **useHookReturn** now ⚠️

Example:

```tsx
createModel({
  hooks: {
    useFilteredTodos: ({ state }) => {
      return React.useMemo(() => {
        return state.todos.items.filter(todo => {
          if (state.todos.filter === 'active') return !todo.isDone;
          if (state.todos.filter === 'completed') return todo.isDone;
          return true;
        });
      }, [state.todos]);
    },
    useSomeOtherCalculation: ({ state }) => {
      return useMemo(() => {
        // some other calculation
      }, [state.someField]);
    },
  },
});

// ...And then inside your component

const filteredTodos = useHookReturn('useFilteredTodos');
```

### v2.0.0

- Renamed the hook for cosuming what was returned from **useRedonk** as defined in **createStore** to **useRedonkReturn** to avoid confusion.

```tsx
// inside component

// used to be this
const whatWasReturnedFromUseRedonk = useRedonk(); // confusing, same name as the hook that get's called inside of the Provider component

// now it's this
const whatWasReturnedFromUseRedonk = useRedonkReturn(); // much clearer 😉
```

```

```
