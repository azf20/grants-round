import {enableFetchMocks, FetchMock} from "jest-fetch-mock"

import {
  fetchFromIPFS,
  pinToIPFS
} from "../utils"

enableFetchMocks()

const fetchMock = fetch as FetchMock

describe("fetchFromIPFS", () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })

  it("should return data from IPFS", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({name: "My First Metadata"}))

    const cid = "bafkreih475g3yk67xjenvlatgumnbtqay7edgyrxevoqzihjltjm3f6cf4"

    const res = await fetchFromIPFS(cid)

    expect(fetchMock).toHaveBeenCalledWith(
      `https://${process.env.REACT_APP_PINATA_GATEWAY}/ipfs/${cid}`
    )
    expect(res).toEqual({name: "My First Metadata"})
  })

  it("should throw on invalid CID", async () => {
    const cid = "invalidcid"

    fetchMock.mockResponseOnce("", {
      status: 404
    })

    await expect(fetchFromIPFS(cid)).rejects.toHaveProperty('status', 404);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://${process.env.REACT_APP_PINATA_GATEWAY}/ipfs/${cid}`
    )
  })
})


describe("pinToIPFS", () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })

  it("should pin JSON data to IPFS", async () => {
    const cid = "bafkreih475g3yk67xjenvlatgumnbtqay7edgyrxevoqzihjltjm3f6cf4"

    fetchMock.mockResponseOnce(JSON.stringify({
      IpfsHash: cid,
      PinSize: 1024,
      TimeStamp: (new Date()).toISOString()
    }))

    const ipfsObject = {
      content: {
        name: "My First Program"
      },
      metadata: {
        name: "program-metadata"
      }
    }

    const res = await pinToIPFS(ipfsObject)

    const params = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pinataMetadata: ipfsObject.metadata,
        pinataOptions: {
          cidVersion: 1
        },
        pinataContent: ipfsObject.content
      }),
    }

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      params
    )
    expect(res.IpfsHash).toEqual(cid)
  })

  it("should pin blob data to IPFS", async () => {
    const cid = "bafkreih475g3yk67xjenvlatgumnbtqay7edgyrxevoqzihjltjm3f6cf4"

    fetchMock.mockResponseOnce(JSON.stringify({
      IpfsHash: cid,
      PinSize: 1024,
      TimeStamp: (new Date()).toISOString()
    }))

    const ipfsObject = {
      content: new Blob([]),
      metadata: {
        name: "program-metadata"
      }
    }

    const res = await pinToIPFS(ipfsObject)

    const fd = new FormData();
    fd.append("file", ipfsObject.content as Blob)
    fd.append("pinataOptions", JSON.stringify({
      cidVersion: 1
    }))
    fd.append("pinataMetadata", JSON.stringify(ipfsObject.metadata))

    const params = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
      },
      body: fd,
    }

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      params
    )
    expect(res.IpfsHash).toEqual(cid)
  })

  it("should reject upon failure to pin blob data", async () => {
    fetchMock.mockResponseOnce("", {
      status: 403
    }) /*Common error-expired API credentials*/

    const ipfsObject = {
      content: new Blob([]),
      metadata: {
        name: "program-metadata"
      }
    }

    await expect(pinToIPFS(ipfsObject)).rejects.toHaveProperty('status', 403);

    const fd = new FormData();
    fd.append("file", ipfsObject.content)
    fd.append("pinataOptions", JSON.stringify({
      cidVersion: 1
    }))
    fd.append("pinataMetadata", JSON.stringify(ipfsObject.metadata))

    const params = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
      },
      body: fd,
    }

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      params
    )
  })

  it("should reject upon failure to pin json data", async () => {
    fetchMock.mockResponseOnce("", {
      status: 403
    }) /*Common error-expired API credentials*/

    const cid = "bafkreih475g3yk67xjenvlatgumnbtqay7edgyrxevoqzihjltjm3f6cf4"

    fetchMock.mockResponseOnce(JSON.stringify({
      IpfsHash: cid,
      PinSize: 1024,
      TimeStamp: (new Date()).toISOString()
    }))

    const ipfsObject = {
      content: {
        name: "My First Program"
      },
      metadata: {
        name: "program-metadata"
      }
    }

    await expect(pinToIPFS(ipfsObject)).rejects.toHaveProperty('status', 403);

    const params = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.REACT_APP_PINATA_JWT}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pinataMetadata: ipfsObject.metadata,
        pinataOptions: {
          cidVersion: 1
        },
        pinataContent: ipfsObject.content
      }),
    }

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      params
    )
  })
})
