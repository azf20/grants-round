import { Round } from "../features/api/types";
import { createContext, useContext, useEffect, useReducer } from "react";
import { useWallet } from "../features/common/Auth";
import { listRounds } from "../features/api/round";

export interface RoundState {
  data: Round[];
  isLoading: boolean;
  error?: Error;
}

enum ActionType {
  START_LOADING = "start-loading",
  FINISH_LOADING = "finish-loading",
  SET_PROGRAMS = "set-rounds",
  SET_LIST_PROGRAMS_ERROR = "set-list-rounds-error",
}

interface Action {
  type: ActionType;
  payload?: any;
}

type Dispatch = (action: Action) => void;

export const initialRoundState: RoundState = {
  data: [],
  isLoading: false,
};
export const RoundContext = createContext<
  { state: RoundState; dispatch: Dispatch } | undefined
>(undefined);

const fetchRounds = async (
  dispatch: Dispatch,
  address: string,
  walletProvider: any,
  programId: string,
  roundId: string
) => {
  dispatch({ type: ActionType.START_LOADING });

  const res = await listRounds(address, walletProvider, programId, roundId);

  if (res.error) {
    dispatch({ type: ActionType.SET_LIST_PROGRAMS_ERROR, payload: res.error });
  }
  dispatch({ type: ActionType.SET_PROGRAMS, payload: res.data });
  dispatch({ type: ActionType.FINISH_LOADING });
};

const roundReducer = (state: RoundState, action: Action) => {
  switch (action.type) {
    case ActionType.START_LOADING:
      return { ...state, isLoading: true };
    case ActionType.FINISH_LOADING:
      return { ...state, isLoading: false };
    case ActionType.SET_PROGRAMS:
      return { ...state, data: action.payload ?? [] };
    case ActionType.SET_LIST_PROGRAMS_ERROR:
      return { ...state, data: [], error: action.payload };
  }
};

export const RoundProvider = ({ children }: { children: any }) => {
  const [state, dispatch] = useReducer(roundReducer, initialRoundState);

  const { address, provider: walletProvider } = useWallet();

  useEffect(() => {
    fetchRounds(dispatch, address, walletProvider);
  }, [address, walletProvider]);

  const providerProps = {
    state,
    dispatch,
  };

  return (
    <RoundContext.Provider value={providerProps}>
      {children}
    </RoundContext.Provider>
  );
};

export const useRounds = () => {
  const context = useContext(RoundContext);
  if (context === undefined) {
    throw new Error("useRounds must be used within a RoundProvider");
  }

  return { ...context.state, dispatch: context.dispatch };
};
