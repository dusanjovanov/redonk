import { createStore } from 'redonk';

export type Todo = {
  id: string;
  text: string;
  isDone: boolean;
};

export type FilterType = 'all' | 'active' | 'completed';

type AppState = {
  counter: {
    count: number;
  };
  todos: {
    items: Todo[];
    filter: FilterType;
  };
};

export const { Provider, useSliceState, useActions } = createStore({
  slices: {
    counter: {
      count: 0,
    },
    todos: {
      items: [
        {
          id: '1',
          text: 'Learn React',
          isDone: false,
        },
      ],
      filter: 'all',
    },
  } as AppState,
  reducers: {
    increment: s => {
      return {
        ...s,
        counter: {
          ...s.counter,
          count: s.counter.count + 1,
        },
      };
    },
    decrement: s => {
      return {
        ...s,
        counter: {
          ...s.counter,
          count: s.counter.count - 1,
        },
      };
    },
    incrementByAmount: (s, amount: number) => {
      return {
        ...s,
        counter: {
          ...s.counter,
          count: s.counter.count + amount,
        },
      };
    },
    resetCounter: s => {
      return {
        ...s,
        counter: {
          ...s.counter,
          count: 0,
        },
      };
    },
    addTodo: (s, todo: Todo) => {
      return {
        ...s,
        todos: {
          ...s.todos,
          items: [...s.todos.items, todo],
        },
      };
    },
    removeTodo: (s, todoId: Todo['id']) => {
      return {
        ...s,
        todos: {
          ...s.todos,
          items: s.todos.items.filter(todo => todo.id !== todoId),
        },
      };
    },
    setTodoText: (s, payload: { id: Todo['id']; text: Todo['text'] }) => {
      return {
        ...s,
        todos: {
          ...s.todos,
          items: s.todos.items.map(todo => {
            if (todo.id === payload.id) return { ...todo, text: payload.text };
            return todo;
          }),
        },
      };
    },
    toggleDone: (s, todoId: Todo['id']) => {
      return {
        ...s,
        todos: {
          ...s.todos,
          items: s.todos.items.map(todo => {
            if (todo.id === todoId) return { ...todo, isDone: !todo.isDone };
            return todo;
          }),
        },
      };
    },
    setFilter: (s, filter: FilterType) => {
      return {
        ...s,
        todos: {
          ...s.todos,
          filter,
        },
      };
    },
  },
});
