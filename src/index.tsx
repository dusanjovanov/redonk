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

  const [modelContexts, initialState] = Object.entries(models).reduce(
    (prev, [modelKey, initialState]) => {
      const stateContext = React.createContext(initialState);
      stateContext.displayName = `${modelKey}.state`;
      prev[0][modelKey] = stateContext;
      prev[1][modelKey] = initialState;
      return prev;
    },
    [{}, {}] as any
  );

  const hooksConfig = Object.entries<any>(hooks).reduce(
    (prev, [hookKey, useHook]) => {
      const hookContext = React.createContext({});
      hookContext.displayName = `${hookKey}`;
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
      Comp.displayName = `${hookKey}.Component`;
      prev[hookKey] = {
        hookContext,
        Comp,
      };
      return prev;
    },
    {} as any
  );

  const actionsContext = React.createContext<ReturnedActions<Actions>>(
    {} as ReturnedActions<Actions>
  );
  actionsContext.displayName = 'RedonkActions';
  const stateContext = React.createContext<State<Models>>(initialState);
  stateContext.displayName = 'RedonkState';

  function Provider({ children }: { children: React.ReactNode }) {
    const [[state, onUpdate], dispatch] = React.useReducer(
      ([state]: any, { cb, modelKey, onUpdate }: any) => {
        if (modelKey && typeof modelKey === 'string') {
          return [
            {
              ...state,
              [modelKey]: cb(state[modelKey]),
            },
            { cb: onUpdate, modelKey },
          ];
        }
        return [cb(state), onUpdate];
      },
      [initialState, stub]
    );

    React.useEffect(() => {
      stateRef.current = state;
      if (typeof onUpdate === 'function') {
        onUpdate(state);
      } else onUpdate.cb(state[onUpdate.modelKey]);
    }, [state, onUpdate]);

    const stateRef = React.useRef<any>(initialState);

    const getStateRef = React.useRef<any>(() => stateRef.current);

    const setRef = React.useRef<any>(async (cbOrModelKey: any, cb: any) => {
      let resolve: (state: any) => void;
      let promise = new Promise(r => {
        resolve = r;
      });
      if (typeof cbOrModelKey === 'function') {
        dispatch({
          cb: cbOrModelKey,
          onUpdate: (state: any) => {
            resolve(state);
          },
        });
      } else {
        dispatch({
          modelKey: cbOrModelKey,
          cb,
          onUpdate: (state: any) => {
            resolve(state);
          },
        });
      }
      return promise;
    });

    const actionsRef = React.useRef(
      Object.entries<any>(actions).reduce<any>((prev, [actionName, action]) => {
        prev[actionName] = (payload: any) =>
          action({
            set: setRef.current,
            payload,
            actions: actionsRef.current,
            getState: getStateRef.current,
          });
        return prev;
      }, {} as ReturnedActions<Actions>)
    );

    function buildModelProviderTree(children: React.ReactNode) {
      return Object.entries<any>(modelContexts).reduce(
        (p, [modelKey, modelStateContext]) => {
          p = React.createElement(
            modelStateContext.Provider,
            {
              value: state[modelKey],
            },
            p
          );
          return p;
        },
        children
      );
    }

    function buildHookComponentTree(children: React.ReactNode) {
      return Object.values<any>(hooksConfig).reduce((p, hookConfig) => {
        p = React.createElement(
          hookConfig.Comp,
          {
            state,
            actions: actionsRef.current,
            set: setRef.current,
          },
          p
        );
        return p;
      }, children);
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
    return React.useContext(hooksConfig[hookKey].hookContext);
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
