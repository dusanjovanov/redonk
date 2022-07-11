import * as React from 'react';

type Action<Reducer> = Reducer extends (state: any) => any
  ? () => void
  : Reducer extends (state: any, payload: infer Payload) => void
  ? (payload: Payload) => void
  : unknown;

type Actions<Reducers> = {
  [ReducerName in keyof Reducers]: Action<Reducers[ReducerName]>;
};
type State<Slices> = {
  [SliceKey in keyof Slices]: Slices[SliceKey];
};

export function createStore<
  Slices,
  Reducers extends {
    [K: string]: (state: State<Slices>, payload: any) => State<Slices>;
  }
>({
  slices = {} as Slices,
  reducers = {} as Reducers,
}: {
  slices: Slices;
  reducers: Reducers;
}) {
  const slicesConfig: any = {};
  const initialState: State<Slices> = {} as State<Slices>;
  for (const [sliceKey, _initialState] of Object.entries(slices)) {
    const context = React.createContext(_initialState);
    context.displayName = sliceKey;
    slicesConfig[sliceKey] = context;
    (initialState as any)[sliceKey] = _initialState;
  }
  const actionsContext = React.createContext<Actions<Reducers>>(
    {} as Actions<Reducers>
  );
  actionsContext.displayName = 'RedonkActions';
  const stateContext = React.createContext<State<Slices>>(initialState);
  stateContext.displayName = 'RedonkState';

  function Provider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = React.useReducer(
      (state: any, { reducer, payload }: any) => reducer(state, payload),
      initialState
    );

    const actions = React.useMemo(() => {
      let actionCreators: Actions<Reducers> = {} as Actions<Reducers>;
      for (const [name, reducer] of Object.entries<any>(reducers)) {
        (actionCreators as any)[name] = (payload: any) =>
          dispatch({ reducer, payload });
      }
      return actionCreators;
    }, []);

    function buildSliceProviderTree(children: React.ReactNode) {
      let tree = children;
      const entries = Object.entries<any>(slicesConfig);
      for (let i = entries.length - 1; i >= 0; i--) {
        const [sliceKey, context] = entries[i];
        tree = React.createElement(
          context.Provider,
          {
            value: state[sliceKey],
          },
          tree
        );
      }
      return tree;
    }

    return (
      <stateContext.Provider value={state}>
        <actionsContext.Provider value={actions}>
          {buildSliceProviderTree(children)}
        </actionsContext.Provider>
      </stateContext.Provider>
    );
  }

  Provider.displayName = 'RedonkProvider';

  function useSliceState<SliceKey extends keyof Slices>(
    sliceKey: SliceKey
  ): Slices[SliceKey] {
    if (!(sliceKey in slicesConfig))
      console.error(
        `[Redonk] You called useSliceState with a slice key which was not passed to createStore`
      );
    return React.useContext(slicesConfig[sliceKey] ?? {});
  }

  function useActions() {
    return React.useContext(actionsContext);
  }

  function useRedonkState() {
    return React.useContext(stateContext);
  }

  return {
    Provider,
    useSliceState,
    useActions,
    useRedonkState,
  };
}
