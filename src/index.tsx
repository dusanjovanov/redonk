import * as React from 'react';

type SetStateCallback<ModelState> = (state: ModelState) => ModelState;
type SetFn<ModelState> = (
  callback: SetStateCallback<ModelState>
) => Promise<ModelState>;
type OnUpdate<ModelState> = (state: ModelState) => void;
type UseReducerState<ModelState> = [ModelState, OnUpdate<ModelState>];
type UseReducerDispatchArgs<ModelState> = {
  callback: SetStateCallback<ModelState>;
  onUpdate: OnUpdate<ModelState>;
};
type GetModelState<ModelName, ModelState> = (
  modelName: ModelName
) => ModelState;
type GetModelActions = any;
type ModelReg<ModelState, ReturnedActions> = {
  getState: () => ModelState;
  getActions: () => ReturnedActions;
};
type ModelProviderProps<ModelName, ModelState, ReturnedActions> = {
  children: React.ReactNode;
  register: (
    modelName: ModelName,
    reg: ModelReg<ModelState, ReturnedActions>
  ) => () => void;
  getModelState: GetModelState<ModelName, any>;
  getModelActions: GetModelActions;
};
type ModelConfig<State, Hook, Actions> = {
  name: string;
  initialState: State;
  useAnything?: Hook;
  actions: Actions;
};
type CombineModelsArgs<Models> = {
  models: {
    [ModelName in keyof Models]: Models[ModelName];
  };
};
type ReturnedAction<Action> = Action extends (args: infer Args) => any
  ? Args extends { payload: infer Payload }
    ? (payload: Payload) => ReturnType<Action>
    : () => ReturnType<Action>
  : any;
type ReturnedActions<Actions> = {
  [ActionName in keyof Actions]: ReturnedAction<Actions[ActionName]>;
};
type _ActionArgs<State> = {
  set: SetFn<State>;
  getModelState: <ModelState = any>(modelName: string) => ModelState;
  getModelActions: (modelName: string) => any;
};
export type ActionArgs<State, Payload = void> = Payload extends void
  ? _ActionArgs<State>
  : _ActionArgs<State> & {
      payload: Payload;
    };

function stub<Return>(_: any): Return {
  return {} as Return;
}

/**
 * This is an abstraction over React Context and useReducer.
 *
 * When you call createModel, 2 contexts are created for that model: StateContext and ActionsContext.
 *
 * StateContext holds the state of the model, and ActionsContext holds the actions for that model.
 *
 * The split between contexts for state and actions is done for performance reasons. ( actions have a stable reference,
 * so the ActionsContext will never update, so if you only need actions in your component, you can just call useModelActions() ).
 *
 * Actions are just functions that can update the model's state, and which you can call directly from your components.
 * Actions can be async or sync, and the set function returns a Promise which resolves when the state gets updated.
 * You can set the state inside the action multiple times.
 *
 * The useAnything hook can be used to react to state changes in the model, or even create computed fields in your state,
 * because what gets returned from useAnything is passed into the StateContext.
 *
 * @param model An object with name, initialState, actions, and useAnything hook.
 *
 * @returns A Provider component which holds the model's state and renders the state and actions contexts,
 *  and hooks for reading the model's state and actions ( useModel, useModelState, useModelActions ).
 */
export function createModel<
  State,
  UseAnything extends (args: {
    state: State;
    actions: ReturnedActions<Actions>;
    set: SetFn<State>;
    getModelState: GetModelState<string, any>;
    getModelActions: GetModelActions;
  }) => any,
  Actions
>(model: ModelConfig<State, UseAnything, Actions>) {
  const stateContext = React.createContext<State & ReturnType<UseAnything>>(
    model.initialState as State & ReturnType<UseAnything>
  );
  const actionsContext = React.createContext<ReturnedActions<Actions>>(
    {} as ReturnedActions<Actions>
  );
  stateContext.displayName = `${model.name}.state`;
  actionsContext.displayName = `${model.name}.actions`;

  function Provider({
    children,
    register,
    getModelState: _getModelState,
    getModelActions: _getModelActions,
  }: ModelProviderProps<string, State, ReturnedActions<Actions>>) {
    const [[state, onUpdate], dispatch] = React.useReducer(
      (
        [state]: UseReducerState<State>,
        { callback, onUpdate }: UseReducerDispatchArgs<State>
      ) => {
        return [callback(state), onUpdate] as UseReducerState<State>;
      },
      [model.initialState, () => {}]
    );

    function getModelState(modelName: string) {
      if (model.name === modelName) {
        return state;
      }
      if (typeof _getModelState !== 'function') {
        console.error(
          `You must call combineModels() in order to get the state of other models. Called getModelState("${modelName}") from "${model.name}" model.`
        );
        return;
      }
      try {
        const modelState = _getModelState(modelName);
        return modelState;
      } catch (err) {
        console.error(
          `Model "${modelName}" is not registered. Called getModelState("${modelName}") from "${model.name}" model.`
        );
      }
    }

    function getModelActions(modelName: string) {
      if (model.name === modelName) {
        return actionsRef.current;
      }
      if (typeof _getModelActions !== 'function') {
        console.error(
          `You must call combineModels() in order to get the actions of other models. Called getModelActions("${modelName}") from "${model.name}" model.`
        );
        return;
      }
      try {
        const modelActions = _getModelActions(modelName);
        return modelActions;
      } catch (err) {
        console.error(
          `Model "${modelName}" is not registered. Called getModelActions("${modelName}") from "${model.name}" model.`
        );
      }
    }

    const setRef = React.useRef(async (callback: SetStateCallback<State>) => {
      let resolve: (state: State) => void;
      let promise = new Promise<State>(r => {
        resolve = r;
      });
      dispatch({
        callback,
        onUpdate: state => {
          resolve(state);
        },
      });
      return promise;
    });

    const actionsRef = React.useRef<ReturnedActions<Actions>>(
      Object.entries<any>(model.actions).reduce((actions, [name, action]) => {
        actions[name] = (payload: number) =>
          action({
            set: setRef.current,
            getModelState,
            getModelActions,
            payload,
          });

        return actions;
      }, {} as any)
    );

    React.useEffect(() => {
      if (typeof register === 'function') {
        return register(model.name, {
          getState: () => state,
          getActions: () => actionsRef.current,
        });
      }
      return;
    }, [state, register]);

    React.useEffect(() => {
      if (onUpdate) onUpdate(state);
    }, [state, onUpdate]);

    let useAnything = stub;
    if (typeof model.useAnything === 'function')
      useAnything = model.useAnything;

    const useAnythingReturn = useAnything<ReturnType<UseAnything>>({
      state,
      set: setRef.current,
      actions: actionsRef.current,
      getModelState,
      getModelActions,
    });

    return (
      <stateContext.Provider value={{ ...state, ...useAnythingReturn }}>
        <actionsContext.Provider value={actionsRef.current}>
          {children}
        </actionsContext.Provider>
      </stateContext.Provider>
    );
  }
  Provider.displayName = `${model.name}.Provider`;

  function useModelState() {
    return React.useContext(stateContext);
  }

  function useModelActions() {
    return React.useContext(actionsContext);
  }

  function useModel() {
    return {
      state: useModelState(),
      actions: useModelActions(),
    };
  }

  return {
    useModelState,
    useModelActions,
    useModel,
    Provider,
  };
}

/**
 * Used to combine all the models into a single Provider component, and get a
 * redux-like API ( similar to slices in redux )
 *
 * @param models A dictionary of the models.
 * @returns A Provider which renders all of the registered models' Providers and is used to
 * create a connection between the models ( getModelState, getModelActions )
 */
export function combineModels<Models>({ models }: CombineModelsArgs<Models>) {
  function Provider({ children }: { children: React.ReactNode }) {
    const providerRefs = React.useRef<any>({});

    function register(modelName: string, reg: any) {
      providerRefs.current[modelName] = reg;
      return () => delete providerRefs.current[modelName];
    }

    function getModelState(modelName: keyof Models) {
      const ref = providerRefs.current[modelName];
      if (ref) {
        return ref.getState();
      }
      throw new Error(`"${modelName}" model not registered in combineModels()`);
    }

    function getModelActions(modelName: keyof Models) {
      const ref = providerRefs.current[modelName];
      if (ref) {
        return ref.getActions();
      }
      throw new Error(`"${modelName}" model not registered in combineModels()`);
    }

    return Object.values<any>(models).reduce((prev, current) => {
      prev = React.createElement(current.Provider, {
        register,
        getModelState,
        getModelActions,
        children: prev,
      });
      return prev;
    }, children);
  }

  return { Provider };
}
