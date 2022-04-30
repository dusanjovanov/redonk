import * as React from 'react';

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
type GetReturnType<T> = T extends (...args: any[]) => infer U ? U : never;

function stub<Return>(_: any): Return {
  return {} as Return;
}

export function createStore<Models, Actions, Hooks>({
  models = {} as Models,
  actions = {} as Actions,
  hooks = {} as Hooks,
}: {
  models: Models;
  actions: Actions;
  hooks?: Hooks;
}) {
  if (Object.keys(models).length === 0) {
    console.error('[Redonk] You must pass at least one model to createStore!');
  }
  const modelContexts: any = {};
  const initialState: State<Models> = {} as State<Models>;
  for (const [modelKey, _initialState] of Object.entries(models)) {
    const stateContext = React.createContext(_initialState);
    stateContext.displayName = modelKey;
    modelContexts[modelKey] = stateContext;
    (initialState as any)[modelKey] = _initialState;
  }

  const hooksConfig: any = {};
  for (const [hookKey, useHook] of Object.entries<any>(hooks)) {
    const hookContext = React.createContext({});
    hookContext.displayName = hookKey;
    const Comp = ({
      children,
      state,
      actions,
      set,
    }: {
      children: React.ReactNode;
      state: State<Models>;
      actions: ReturnedActions<Actions>;
      set: SetFn<State<Models>>;
    }) => {
      const hookReturn = useHook({ state, actions, set });
      return (
        <hookContext.Provider value={hookReturn}>
          {children}
        </hookContext.Provider>
      );
    };
    (Comp as any).displayName = `${hookKey}.Component`;
    hooksConfig[hookKey] = {
      hookContext,
      Comp,
    };
  }

  const actionsContext = React.createContext<ReturnedActions<Actions>>(
    {} as ReturnedActions<Actions>
  );
  actionsContext.displayName = 'RedonkActions';
  const stateContext = React.createContext<State<Models>>(initialState);
  stateContext.displayName = 'RedonkState';

  function Provider({ children }: { children: React.ReactNode }) {
    const [[state, onUpdate], dispatch] = React.useReducer(
      ([state]: any, args: any) => {
        const { cb, modelKey, onUpdate } = args;
        if ('modelKey' in args && typeof modelKey === 'string') {
          return [
            {
              ...state,
              [modelKey]: cb(state[modelKey]),
            },
            onUpdate,
          ];
        }
        return [cb(state), onUpdate];
      },
      [initialState, stub]
    );

    React.useEffect(() => {
      stateRef.current = state;
      if (typeof onUpdate === 'function') onUpdate(state);
    }, [state, onUpdate]);

    const stateRef = React.useRef<any>(initialState);

    const getStateRef = React.useRef<any>(() => stateRef.current);

    const setRef = React.useRef<any>(async (cbOrModelKey: any, cb: any) => {
      let resolve: (state: any) => void;
      let promise = new Promise<State<Models>>(r => {
        resolve = r;
      });
      if (typeof cbOrModelKey === 'function') {
        dispatch({
          cb: cbOrModelKey,
          onUpdate: (state: any) => resolve(state),
        });
      } else {
        dispatch({
          modelKey: cbOrModelKey,
          cb,
          onUpdate: (state: any) => resolve(state),
        });
      }
      return promise;
    });

    const actionsRef = React.useRef(
      (() => {
        let _actions: ReturnedActions<Actions> = {} as ReturnedActions<Actions>;
        for (const [actionName, action] of Object.entries<any>(actions)) {
          (_actions as any)[actionName] = (payload: any) =>
            action({
              set: setRef.current,
              payload,
              actions: actionsRef.current,
              getState: getStateRef.current,
            });
        }
        return _actions;
      })()
    );

    function buildModelProviderTree(children: React.ReactNode) {
      let tree = children;
      const entries = Object.entries<any>(modelContexts);
      for (let i = entries.length - 1; i >= 0; i--) {
        const [modelKey, modelContext] = entries[i];
        tree = React.createElement(
          modelContext.Provider,
          {
            value: state[modelKey],
          },
          tree
        );
      }
      return tree;
    }

    function buildHookComponentTree(children: React.ReactNode) {
      let tree = children;
      const values = Object.values<any>(hooksConfig);
      for (let i = values.length - 1; i >= 0; i--) {
        const hookConfig = values[i];
        tree = React.createElement(
          hookConfig.Comp,
          {
            state,
            actions: actionsRef.current,
            set: setRef.current,
          },
          tree
        );
      }
      return tree;
    }

    return (
      <stateContext.Provider value={state}>
        <actionsContext.Provider value={actionsRef.current}>
          {buildModelProviderTree(buildHookComponentTree(children))}
        </actionsContext.Provider>
      </stateContext.Provider>
    );
  }

  Provider.displayName = 'RedonkProvider';

  function useModelState<modelKey extends keyof Models>(
    modelKey: modelKey
  ): Models[modelKey] {
    return React.useContext(modelContexts[modelKey] ?? {});
  }

  function useActions() {
    return React.useContext(actionsContext);
  }

  function useHookReturn<HookKey extends keyof Hooks>(
    hookKey: HookKey
  ): GetReturnType<Hooks[HookKey]> {
    return React.useContext(hooksConfig[hookKey]?.hookContext ?? {});
  }

  function useRedonkState() {
    return React.useContext(stateContext);
  }

  return {
    Provider,
    useModelState,
    useActions,
    useHookReturn,
    useRedonkState,
  };
}
