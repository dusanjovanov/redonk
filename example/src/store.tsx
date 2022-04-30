import * as React from 'react';
import { createStore, ActionArgs, HookArgs } from 'redonk';

export type Todo = {
  id: string;
  text: string;
  isDone: boolean;
};

type FilterType = 'all' | 'active' | 'completed';

type AppState = {
  counter: {
    count: number;
  };
  todos: {
    items: Todo[];
    filter: FilterType;
  };
};

export const {
  Provider,
  useModelState,
  useActions,
  useHookReturn,
} = createStore({
  models: {
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
  hooks: {
    useFilteredTodos: ({ state }: HookArgs<AppState>) => {
      return React.useMemo(() => {
        return state.todos.items.filter(todo => {
          if (state.todos.filter === 'active') return !todo.isDone;
          if (state.todos.filter === 'completed') return todo.isDone;
          return true;
        });
      }, [state.todos]);
    },
    useIsFilterActive: ({ state }: HookArgs<AppState>) => {
      return React.useCallback(
        (filterToCheck: FilterType) => filterToCheck === state.todos.filter,
        [state.todos.filter]
      );
    },
  },
  actions: {
    increment: ({ set }: ActionArgs<AppState>) => {
      set('counter', s => ({
        ...s,
        count: s.count + 1,
      }));
    },
    decrement: ({ set }: ActionArgs<AppState>) => {
      set('counter', s => ({
        ...s,
        count: s.count - 1,
      }));
    },
    incrementByAmount: ({ set, payload }: ActionArgs<AppState, number>) => {
      set('counter', s => ({
        ...s,
        count: s.count + payload,
      }));
    },
    resetCounter: ({ set }: ActionArgs<AppState>) => {
      set('counter', s => ({ ...s, count: 0 }));
    },
    addTodo: ({ set, payload }: ActionArgs<AppState, Todo>) => {
      set('todos', s => ({
        ...s,
        items: [...s.items, payload],
      }));
    },
    removeTodo: ({ set, payload }: ActionArgs<AppState, Todo['id']>) => {
      set('todos', s => ({
        ...s,
        items: s.items.filter(todo => todo.id !== payload),
      }));
    },
    setTodoText: ({
      set,
      payload,
    }: ActionArgs<AppState, { id: Todo['id']; text: Todo['text'] }>) => {
      set('todos', s => ({
        ...s,
        items: s.items.map(todo => {
          if (todo.id === payload.id) return { ...todo, text: payload.text };
          return todo;
        }),
      }));
    },
    toggleDone: ({ set, payload }: ActionArgs<AppState, Todo['id']>) => {
      set('todos', s => ({
        ...s,
        items: s.items.map(todo => {
          if (todo.id === payload) return { ...todo, isDone: !todo.isDone };
          return todo;
        }),
      }));
    },
    setFilter: ({ set, payload }: ActionArgs<AppState, FilterType>) => {
      set('todos', s => ({ ...s, filter: payload }));
    },
  },
});
