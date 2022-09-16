import { makeGrantApplicationData } from "../../../test-utils";
import { getApplicationById } from "../application";
import { graphql_fetch } from "../utils";

const signerOrProviderStub = {
  getNetwork: async () => Promise.resolve({ chainId: "chain" }),
};

describe("getApplicationById", () => {
  it("should retrieve application data given an application id", async () => {
    const expectedApplication = makeGrantApplicationData();
    const applicationId = expectedApplication.id;
    (graphql_fetch as jest.Mock).mockResolvedValue({
      data: {},
    });
    // TODO - see what qraphql results look like
    // TODO - mock fetch from IPFS call
    // once ^ done, then should have same-ish behavior as RTK query
    // then we can try to retrieve project owner info from project registry smart contract

    const actualApplication = await getApplicationById(
      applicationId,
      signerOrProviderStub
    );

    expect(actualApplication).toEqual(expectedApplication);
  });
});
