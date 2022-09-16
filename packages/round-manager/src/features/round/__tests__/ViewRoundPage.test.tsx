/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { render, screen } from "@testing-library/react";
import { useWallet } from "../../common/Auth";
import { useListRoundsQuery } from "../../api/services/round";
import ViewRoundPage from "../ViewRoundPage";
import { GrantApplication, Round } from "../../api/types";
import {
  makeGrantApplicationData,
  makeRoundData,
  wrapWithProgramContext,
  wrapWithRoundContext,
} from "../../../test-utils";
import {
  useBulkUpdateGrantApplicationsMutation,
  useListGrantApplicationsQuery,
} from "../../api/services/grantApplication";
import { useDisconnect, useSwitchNetwork } from "wagmi";
import { useParams } from "react-router-dom";

jest.mock("../../common/Auth");
jest.mock("../../api/services/round");
jest.mock("../../api/services/grantApplication");
jest.mock("wagmi");
jest.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: jest.fn(),
}));

Object.assign(navigator, {
  clipboard: {
    writeText: () => {},
  },
});

const mockRoundData: Round = makeRoundData();
const mockApplicationData: GrantApplication[] = [];

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
}));

describe("the view round page", () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockImplementation(() => {
      return {
        id: mockRoundData.id,
      };
    });

    (useWallet as jest.Mock).mockReturnValue({
      chain: {},
      address: mockRoundData.operatorWallets![0],
    });

    (useListRoundsQuery as jest.Mock).mockReturnValue({
      round: mockRoundData,
      isLoading: false,
      isSuccess: true,
    });

    (useListGrantApplicationsQuery as jest.Mock).mockReturnValue({
      data: mockApplicationData,
      refetch: jest.fn(),
      isLoading: false,
      isSuccess: true,
    });

    (useBulkUpdateGrantApplicationsMutation as jest.Mock).mockReturnValue([
      jest.fn(),
      {
        isLoading: false,
      },
    ]);

    (useSwitchNetwork as jest.Mock).mockReturnValue({ chains: [] });
    (useDisconnect as jest.Mock).mockReturnValue({});
  });

  it("should display 404 when there no round is found", () => {
    (useParams as jest.Mock).mockReturnValueOnce({
      id: undefined,
    });

    render(
      wrapWithProgramContext(
        wrapWithRoundContext(<ViewRoundPage />, {
          data: [],
          isLoading: false,
        }),
        { programs: [] }
      )
    );
    expect(screen.getByText("404 ERROR")).toBeInTheDocument();
  });

  it("should display access denied when wallet accessing is not program operator", () => {
    (useWallet as jest.Mock).mockReturnValue({ chain: {} });

    render(
      wrapWithProgramContext(
        wrapWithRoundContext(<ViewRoundPage />, {
          data: [mockRoundData],
          isLoading: false,
        }),
        { programs: [] }
      )
    );
    expect(screen.getByText("Access Denied!")).toBeInTheDocument();
  });

  it("should display Copy to Clipboard", () => {
    renderWrapped(<ViewRoundPage />);
    expect(screen.getByText("Copy to clipboard")).toBeInTheDocument();
  });

  it("should display copy when there are no applicants for a given round", () => {
    render(
      wrapWithProgramContext(
        wrapWithRoundContext(<ViewRoundPage />, {
          data: [mockRoundData],
          isLoading: false,
        }),
        { programs: [] }
      )
    );
    expect(screen.getByText("No Applications")).toBeInTheDocument();
  });

  it("should indicate how many of each kind of application there are", () => {
    const mockApplicationData: GrantApplication[] = [
      makeGrantApplicationData({ status: "PENDING" }),
      makeGrantApplicationData({ status: "PENDING" }),
      makeGrantApplicationData({ status: "REJECTED" }),
      makeGrantApplicationData({ status: "APPROVED" }),
    ];
    (useListGrantApplicationsQuery as jest.Mock).mockReturnValue({
      data: mockApplicationData,
      isLoading: false,
      isSuccess: true,
    });

    render(
      wrapWithProgramContext(
        wrapWithRoundContext(<ViewRoundPage />, {
          data: [mockRoundData],
          isLoading: false,
        }),
        { programs: [] }
      )
    );

    expect(
      parseInt(screen.getByTestId("received-application-counter").textContent!)
    ).toBe(2);
    expect(
      parseInt(screen.getByTestId("rejected-application-counter").textContent!)
    ).toBe(1);
    expect(
      parseInt(screen.getByTestId("approved-application-counter").textContent!)
    ).toBe(1);
  });

  it("should display loading spinner when round is loading", () => {
    (useListRoundsQuery as jest.Mock).mockReturnValue({
      isLoading: true,
    });

    renderWrapped(<ViewRoundPage />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });
});
