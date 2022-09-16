import { makeGrantApplicationData } from "../../../test-utils";
import { getApplicationById } from "../application";
import { fetchFromIPFS, graphql_fetch } from "../utils";
import { GrantApplication } from "../types";

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  graphql_fetch: jest.fn(),
  fetchFromIPFS: jest.fn(),
}));

const signerOrProviderStub = {
  getNetwork: async () => Promise.resolve({ chainId: "chain" }),
};

describe("getApplicationById", () => {
  it("should retrieve application data given an application id", async () => {
    const expectedApplication: GrantApplication = makeGrantApplicationData();
    const applicationId = expectedApplication.id;
    const expectedProjectsMetaPtr = expectedApplication.projectsMetaPtr;
    const expectedApplicationMetaPtr = {
      protocol: 1,
      pointer: "bafkreigfajf5ud3js6bmh3lwg5sp7cqyrqoy7e65y25myyqjywllxvcw2u",
    };
    (graphql_fetch as jest.Mock).mockResolvedValue({
      data: {
        roundProjects: [
          {
            id: expectedApplication.id,
            metaPtr: expectedApplicationMetaPtr,
            status: "PENDING",
            round: {
              projectsMetaPtr: expectedProjectsMetaPtr,
            },
          },
        ],
      },
    });

    (fetchFromIPFS as jest.Mock).mockImplementation((metaptr: string) => {
      if (metaptr === expectedApplicationMetaPtr.pointer) {
        return {
          round: expectedApplication.round,
          recipient: expectedApplication.recipient,
          project: expectedApplication.project,
          answers: expectedApplication.answers,
        };
      }
      if (metaptr === expectedProjectsMetaPtr.pointer) {
        return [
          {
            id: expectedApplication.id,
            status: expectedApplication.status,
          },
        ];
      }
    });

    // then we can try to retrieve project owner info from project registry smart contract

    const actualApplication = await getApplicationById(
      applicationId,
      signerOrProviderStub
    );

    expect(actualApplication).toEqual({ data: expectedApplication });
  });
});
