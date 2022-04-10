# **Redonk**

Ridiculously simple state management in pure React 🎉
<br />
<br />

## **Installation**

```bash
npm install redonk
```

```bash
yarn add redonk
```

## **Highlights**

- Pure React state and context and only around **230B** in production (**Redux** usually adds around **17kB**)
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

- This library is pure React and only around **230B** in production.
- There aren't any **_selectors_** - you just subscribe to the whole state of a single model, or just actions (which never change). This should be a good enough performance optimization as you often tend to use multiple fields from a single **redux** slice in your component. This also simplifies things quite a bit as you can just get the state you need without having to deal with memoization and using **reselect**.

- **_Actions_** in this library are not case reducers. They're basically just like functions that you define
  inside your component. They can update the model's state with **set**, they can be async so you can make
  API requests inside of them, and what you return from your action gets returned to the caller (component).

- There aren't any access restrictions between models. When you call **combineModels** and render the returned Provider, you get the ability for the models to
  communicate with each other through **getModelState** and **getModelActions**. These functions are
  available in your actions. So every action can access it's own, or any other model's state and actions.

## **API**

### **_createModel(model: ModelConfig) => { Provider, useModel, useModelState, useModelActions }_**

<br />

This function creates the following things:

- Two contexts (one for state, and another for actions)
- A **_Provider_** component which holds the model's state and actions and renders the state context with the appropriate values being passed.
- Three hooks for getting state and actions in your components: **_useModelState_**, **_useModelActions_**, and **_useModel_**.

```tsx
import { createModel } from 'redonk';

const counterModel = createModel({
  name: 'counter',
  initialState: {
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
  useAnything: ({ state }) => {
    useEffect(() => {
      console.log('State changed');
    }, [state]);
  },
});
const {
  Provider: CounterProvider,
  useModel: useCounterModel,
  useModelState: useCounterModelState,
  useModelActions: useCounterModelActions,
} = counterModel;
```

## _Accepts_:

<br />

### **_name_**

<br />

Name of the model.

<br />

### **_initialState_**

<br />

The initial state of the model.

<br />

### **_actions_**

<br />

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

### **_useAnything: ({state, actions, set, getModelState, getModelActions}) => { [key: string]: any }_**

<br />

This hook is called inside the model's Provider component and you have access to everything inside the model.
What you return from this function gets merged with the StateContext's value, and you can access it with **useModelState** and **useModel**.

<br />

You can use it for computed fields:

```tsx
useAnything: ({ state }) => {
  const filteredTodos = useMemo(() => {
    return state.todos.filter(todo => {
      if (state.filter === 'active') return !todo.isDone;
      if (state.filter === 'completed') return todo.isDone;
      return true;
    });
  }, [state.todos, state.filter]);

  return { filteredTodos };
};

// and then in your component
const { filteredTodos } = useTodosModelState();

return (
  <>
    {filteredTodos.map(todo => ...)}
  </>
)
```

For effects:

```tsx
useAnything: ({ state }) => {
  useEffect(() => {
    // do something when state changes
  }, [state]);
};
```

Or anything else really, be creative!

<br />

## _Action and useAnything args_:

<br />

### **_set: (callback: (state: ModelState) => ModelState) => Promise\<ModelState\>_**

<br />

The set function accepts a callback that accepts the current state as the argument and expects you to return the new state of the model.

It returns a Promise with the new state, so you can await and know when the state has been updated.

Don't worry, this is completely safe. It's based on the same pattern [**useEffectReducer**](https://github.com/davidkpiano/useEffectReducer#isnt-this-unsafe) uses.

```tsx
someAction: async ({ set }) => {
  return await set(state => ({ ...state, count: 3 }));
};

// in your component
const newCount = someAction();
```

<br />

### **_getModelState: (modelName: string) => ModelState_**

<br />

Used to read a model's state by it's name. If you try to access the state of the model you're in, you'll get the state back without the need to call **combineModels**.

If you want to access a different model's state, you need to register all your models with **combineModels** and wrap your application with the returned **Provider**.

```tsx
someAction: ({ getModelState }) => {
  const otherModelsState = getModelState('otherModel');
};
```

### **_getModelActions: (modelName: string) => ModelActions_**

<br />

Used to read a model's actions by it's name. If you try to access the actions of the model you're in, you'll get the actions back without the need to call **combineModels**.

If you want to access a different model's actions, you need to register all your models with **combineModels** and wrap your application with the returned **Provider**.

```tsx
someAction: ({ getModelActions }) => {
  const otherModelsActions = getModelActions('otherModel');
  otherModelsActions.doSomething();
};
```

## _Returns_:

<br />

### **_Provider_**

<br />

Holds the state and actions of the model, calls the **_useAnything_** hook, and renders the state and actions contexts while passing state and result of **_useAnything_** hook to the state context and actions to the actions context.

Wrap your component tree with it if you only have one model, otherwise use the **_Provider_** returned
from **_combineModels_**

```tsx
return (
  <Provider>
    {...}
  </Provider>
)
```

### **_useModelState()_**

<br />

Returns the state of the model.

```tsx
const state = useModelState();
```

### **_useModelActions()_**

<br />

Returns the actions of the model. Never causes the component to render, because actions never change their reference. Use when you only need actions in your component.

```tsx
const actions = useModelActions();
```

### **_useModel()_**

<br />

Returns the combined results of **_useModelState_** and **_useModelActions_**.
Use when you need both state and actions in a component.

```tsx
const { state, actions } = useModel();
```

---

<br />

### **_combineModels({ models }) => { Provider }_**

<br />

Returns a Provider which renders all the registered model's Providers, and gives you the ability to access other model's states and actions from your model.

```tsx
import { createModel, combineModels } from 'redonk';

const counterModel = createModel(...)
const todosModel = createModel(...)

const { Provider } = combineModels({
  models: {
    counter: counterModel,
    todos: todosModel,
  }
});

const App = () => {
  return (
    <Provider>
      {...}
    <Provider>
  )
}
```

<br />

## **Usage with Typescript**

<br />

When creating a model, you should define the type of your state:

```tsx
  type CounterState = {
    count: number;
  }

  // like this
  createModel({
    initialState: {
      count: 0
    } as CounterState
  })

  // or like this
  const initialState: CounterState = {
    count: 0;
  }

  createModel({
    initialState
  })
```

You also need to define the types of your action arguments including the payload:

```tsx
import { ActionArgs } from 'redonk';

type CounterState = {
  count: number;
};

createModel({
  actions: {
    // without payload
    increment: ({ set }: ActionArgs<CounterState>) => {},
    // with payload
    // the first generic type is State, and the second generic to ActionArgs is Payload
    incrementByAmount: ({
      set,
      payload,
    }: ActionArgs<CounterState, number>) => {},
  },
});
```

And voila! You have intellisense everywhere:

```tsx
// inside component
const state = useCounterModelState(); // state is correctly inferred as { count: number }

const actions = useCounterModelActions(); // actions are correctly inferred including the type of Payload

const { state, actions } = useCounterModel(); // same thing as above
```

A little disclaimer:

Unfortunately there's no inferrence for **getModelState** and **getModelActions** yet, but in the meantime, you can explicitly set the return type for **getModelState** like so:

```tsx
const counterState = getModelState<CounterState>('counter'); // counterState inferred as { count: number }
```

## **Types**

```tsx
type ModelConfig = {
  name: string;
  initialState: any;
  useAnything?: UseAnything;
  actions: Actions;
};

type Actions = {
  [key: string]: Action;
};

type SetStateCallback<ModelState> = (state: ModelState) => ModelState;

type SetFn<ModelState> = (
  callback: SetStateCallback<ModelState>
) => Promise<ModelState>;

export type ActionArgs<State, Payload = void> = {
  set: SetFn<State>;
  getModelState: <ModelState = any>(modelName: string) => ModelState;
  getModelActions: (modelName: string) => any;
  payload?: Payload;
};

type Action = (args: ActionArgs) => any | Promise<any>;

type UseAnything = ({
  state: any,
  actions,
  set,
  getModelState,
  getActionsState,
}) => { [key: string]: any };

type CombineModelsArgs<Models> = {
  models: {
    [ModelName in keyof Models]: Models[ModelName];
  };
};
```
