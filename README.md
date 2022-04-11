# **Redonk**

Ridiculously simple state management in pure React 🎉
<br />

[DEMO](https://codesandbox.io/s/redonk-example-5gmjmx)

## **Installation**

```bash
npm install redonk
```

```bash
yarn add redonk
```

## **Highlights**

- Pure React state and context and only around **900B** in production (**Redux** usually adds around **17kB**)
- Good performance - optimized by splitting models' state and actions into separate contexts
- Nice, structured API similar to **@reduxjs/toolkit**
- Very simple to use
- No selectors
- No thunks or other special async stuff - you can do anything with just actions
- Full Typescript support

## **Idea**

The idea was to create a global state management with just React state and context,
but context has performance issues when you put all your state into a single context,
and creating separate contexts manually is a lot of work.
So then, inspired by the **constate** library, we created a helper
for creating contexts and state, but gave it structure and pattern similar to **@reduxjs/toolkit**.

Differences between this and **@reduxjs/toolkit** (and **redux** in general):

- This library is pure React and only around **900B** in production.

- There aren't any **_selectors_** - you just subscribe to the whole state of a single model, or just actions (which never change). This should be a good enough performance optimization as you often tend to use multiple fields from a single **redux** slice in your component. This also simplifies things quite a bit as you can just get the state you need without having to deal with memoization and using **reselect**.

- **_Actions_** in this library are not case reducers. They're basically just like functions that you define
  inside your component. They can update the model's state with **set**, they can be async so you can make
  API requests inside of them, and what you return from your action gets returned to the caller (component).

## **API**

The library only exports one function!

### **_createStore({ models, actions, useRedonk }) => { Provider, useModelState, useActions, useRedonk, useRedonkState }_**

<br />

This function does the following things:

- Creates the state with useReducer
- Creates a state context for each of the models defined, and passes the corresponding slice of state to each of those models
- Creates an actions context and passes a modified version of the actions defined in it ( actions never change their ref, so this context never gets updated )
- Creates a useRedonk context which holds the value that was returned from the **useRedonk** hook
- Creates the Provider component which holds the state, and renders all of the contexts.
- Creates three hooks for consuming state and actions:
  - **useModelState** which accepts a **modelKey** to know to which model's context to subscribe to
  - **useActions** for subscribing to the actions context
  - **useRedonk** for subscribing to the useRedonk context for getting what was returned from the **useRedonk** hook

```tsx
import { createStore } from 'redonk';

const {
  Provider,
  useModelState,
  useActions,
  useRedonk,
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
  useRedonk: ({ state }) => {
    useEffect(() => {
      console.log('State changed');
    }, [state]);
  },
});
```

## _Accepts_:

### **_models_**

An object that defines how the state will be split into contexts.

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

### **_useRedonk: ({ state, actions, set }) => any_**

This hook is called inside the Provider component and you have access to everything inside the "store".
It get's called any time the state is updated.
What you return from this function gets passed in the UseRedonk context, and you can access it with **useRedonk** hook.

<br />

You can use it for computed fields:

```tsx
useRedonk: ({ state }) => {
  const filteredTodos = useMemo(() => {
    return state.todos.items.filter(todo => {
      if (state.todos.filter === 'active') return !todo.isDone;
      if (state.todos.filter === 'completed') return todo.isDone;
      return true;
    });
  }, [state.todos.items, state.todos.filter]);

  // needs to be memoized because we are returning a new object
  // if we didn't memoize it, the UseRedonk context would update every time the state updates!
  return useMemo(() => {
    return { filteredTodos }
  }, [filteredTodos]);
};

// and then in your component
const { filteredTodos } = useRedonk();

return (
  <>
    {filteredTodos.map(todo => ...)}
  </>
)
```

For effects:

```tsx
useRedonk: ({ state }) => {
  useEffect(() => {
    // do something when state changes
  }, [state]);
};
```

Or anything else really, be creative!

### **_useRedonkState: () => State_**

Hook for getting the entire state of Redonk. Causes a render on every state update, so use wisely!

```tsx
// inside component
const entireState = useRedonkState();
```

## _Action and useRedonk args_:

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

Returns the state of the model which key was passed in.

```tsx
const counterState = useModelState('counter');
```

### **_useActions()_**

Returns all of the actions.

```tsx
const actions = useActions();
```

### **_useRedonk()_**

Returns whatever you returned from the **useRedonk** hook defined when creating the store.

```tsx
const useRedonkReturn = useRedonk();
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

And voila! You have intellisense everywhere:

```tsx
// inside component
const counterState = useModelState('counter'); // counter state is correctly inferred as { count: number }

const actions = useActions(); // actions are correctly inferred including the type of Payload

const useRedonkReturn = useRedonk(); // correctly inferred

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
```
