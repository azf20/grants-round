import { fetchFromIPFS, graphql_fetch } from "./utils";
import {
  GrantApplication,
  GrantApplicationId,
  MetadataPointer,
  ProjectStatus,
} from "./types";
import { updateApplicationStatusFromContract } from "./services/grantApplication";

export const getApplicationById = async (id: string, signerOrProvider: any) => {
  try {
    // fetch chain id
    const { chainId } = await signerOrProvider.getNetwork();

    // query the subgraph for all rounds by the given account in the given program
    const res = await graphql_fetch(
      `
              query GetGrantApplications($id: String) {
                roundProjects(where: {
                 id: $id
                }) {
                  id
                  metaPtr {
                    protocol
                    pointer
                  }
                  status
                  round {
                    projectsMetaPtr {
                      protocol
                      pointer
                    }
                  }
                }
              }
            `,
      chainId,
      { id }
    );

    const grantApplications: GrantApplication[] = [];

    for (const project of res.data.roundProjects) {
      const metadata = await fetchFromIPFS(project.metaPtr.pointer);

      let status = project.status;

      if (id) {
        status = await checkGrantApplicationStatus(
          project.id,
          project.round.projectsMetaPtr
        );
      }

      grantApplications.push({
        ...metadata,
        status,
        id: project.id,
        projectsMetaPtr: project.round.projectsMetaPtr,
      });
    }

    const grantApplicationsFromContract =
      res.data.roundProjects.length > 0
        ? await updateApplicationStatusFromContract(
            grantApplications,
            res.data.roundProjects[0].round.projectsMetaPtr
          )
        : grantApplications;

    return { data: grantApplicationsFromContract[0] };
  } catch (e) {
    console.error("error", e);
    return {}; // TODO
  }
};

/**
 * Check status of a grant application
 *
 * @param id - the application id
 * @param projectsMetaPtr - the pointer to a decentralized storage
 */
export const checkGrantApplicationStatus = async (
  id: GrantApplicationId,
  projectsMetaPtr: MetadataPointer
): Promise<ProjectStatus> => {
  let reviewedApplications: any = [];

  // read data from ipfs
  if (projectsMetaPtr) {
    reviewedApplications = await fetchFromIPFS(projectsMetaPtr.pointer);
  }

  const obj = reviewedApplications.find((o: any) => o.id === id);

  return obj ? obj.status : "PENDING";
};
