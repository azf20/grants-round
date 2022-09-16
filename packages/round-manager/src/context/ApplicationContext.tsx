import React, { createContext, useContext, useEffect, useReducer } from "react";
import { GrantApplication } from "../features/api/types";
import { useWallet } from "../features/common/Auth";

enum ActionType {
  SET_PROGRAMS = "SET_PROGRAMS",
}

interface Action {
  type: ActionType;
  payload?: any;
}

type Dispatch = (action: Action) => void;

interface ApplicationState {
  application?: GrantApplication;
}

export const ApplicationContext = createContext<
  { state: ApplicationState; dispatch: Dispatch } | undefined
>(undefined);

const applicationReducer = (
  state: ApplicationState,
  action: Action
): ApplicationState => {
  switch (action.type) {
    case ActionType.SET_PROGRAMS:
      return {
        ...state,
        application: action.payload,
      };
  }
};

const initialApplicationState: ApplicationState = {
  application: undefined,
};

export const ApplicationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(
    applicationReducer,
    initialApplicationState
  );

  const providerProps = {
    state,
    dispatch,
  };

  return (
    <ApplicationContext.Provider value={providerProps}>
      {children}
    </ApplicationContext.Provider>
  );
};

function fetchApplicationById(
  dispatch: Dispatch,
  id: string | undefined,
  walletProvider: any
) {
  getApplicationById(id, walletProvider).then((application) => {
    dispatch({ type: ActionType.SET_PROGRAMS, payload: application });
  });
  // .catch()
  // .finally()
}

export const useApplicationById = (
  id?: string
): {
  application: GrantApplication | undefined;
} => {
  const context = useContext(ApplicationContext);

  if (context === undefined) {
    throw new Error(
      "useApplicationById must be used within a ApplicationProvider"
    );
  }

  const { provider: walletProvider } = useWallet();

  useEffect(() => {
    fetchApplicationById(context.dispatch, id, walletProvider);
  }, [id, walletProvider]);

  return {
    application: undefined,
  };
};
