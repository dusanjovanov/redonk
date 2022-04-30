import * as React from 'react';
import { useActions, Todo, useHookReturn } from './store';

const TodosFilters = () => {
  const isFilterActive = useHookReturn('useIsFilterActive');
  const { setFilter } = useActions();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        style={{
          backgroundColor: isFilterActive('all') ? '#1AB741' : undefined,
        }}
        onClick={() => setFilter('all' as never)}
      >
        All
      </button>
      <button
        style={{
          backgroundColor: isFilterActive('active') ? '#1AB741' : undefined,
        }}
        onClick={() => setFilter('active' as never)}
      >
        Active
      </button>
      <button
        style={{
          backgroundColor: isFilterActive('completed') ? '#1AB741' : undefined,
        }}
        onClick={() => setFilter('completed' as never)}
      >
        Completed
      </button>
    </div>
  );
};

const TodoInput = ({
  todoId,
  todoText,
}: {
  todoId: Todo['id'];
  todoText: Todo['text'];
}) => {
  const { setTodoText } = useActions();

  return (
    <input
      type="text"
      value={todoText}
      onChange={e =>
        setTodoText({
          id: todoId,
          text: e.target.value,
        })
      }
    />
  );
};

const TodoIsDoneCheckBox = ({
  todoId,
  todoIsDone,
}: {
  todoId: Todo['id'];
  todoIsDone: Todo['isDone'];
}) => {
  const { toggleDone } = useActions();

  return (
    <input
      type="checkbox"
      checked={todoIsDone}
      onChange={() => toggleDone(todoId)}
    />
  );
};

const TodoListItem = React.memo(({ todo }: { todo: Todo }) => {
  const { removeTodo } = useActions();

  return (
    <li style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <TodoIsDoneCheckBox todoId={todo.id} todoIsDone={todo.isDone} />
        <TodoInput todoId={todo.id} todoText={todo.text} />
        <button onClick={() => removeTodo(todo.id)}>Remove</button>
      </div>
    </li>
  );
});

const TodosList = () => {
  const filteredTodos = useHookReturn('useFilteredTodos');

  return (
    <ul style={{ listStyleType: 'none', padding: 0 }}>
      {filteredTodos.map(todo => {
        return <TodoListItem key={todo.id} todo={todo} />;
      })}
    </ul>
  );
};

export const Todos = () => {
  const { addTodo } = useActions();

  return (
    <div>
      <h1>Todos</h1>
      <TodosFilters />
      <TodosList />
      <button
        onClick={() =>
          addTodo({
            id: Date.now().toString(),
            text: 'New todo',
            isDone: false,
          })
        }
      >
        Add todo
      </button>
    </div>
  );
};
