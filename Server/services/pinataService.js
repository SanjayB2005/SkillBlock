const PINATA_API_BASE = 'https://api.pinata.cloud';

const getAuthHeaders = () => {
  const jwt = process.env.PINATA_JWT?.trim();
  if (jwt) {
    return {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    };
  }

  const apiKey = process.env.PINATA_API?.trim();
  const apiSecret = process.env.PINATA_API_SECRET?.trim();
  if (apiKey && apiSecret) {
    return {
      pinata_api_key: apiKey,
      pinata_secret_api_key: apiSecret,
      'Content-Type': 'application/json',
    };
  }

  throw new Error('Pinata credentials are missing. Set PINATA_JWT or PINATA_API + PINATA_API_SECRET.');
};

const buildGatewayUrl = (cid) => {
  const gateway = process.env.PINATA_GATEWAY?.trim() || 'https://gateway.pinata.cloud/ipfs';
  return `${gateway}/${cid}`;
};

const pinJson = async (payload, name = 'skillblock-proof-metadata') => {
  const body = {
    pinataContent: payload,
    pinataMetadata: {
      name,
    },
    pinataOptions: {
      cidVersion: 1,
    },
  };

  const response = await fetch(`${PINATA_API_BASE}/pinning/pinJSONToIPFS`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Pinata pinJSONToIPFS failed: ${response.status} ${message}`);
  }

  const data = await response.json();
  return {
    cid: data.IpfsHash,
    ipfsUri: `ipfs://${data.IpfsHash}`,
    gatewayUrl: buildGatewayUrl(data.IpfsHash),
    pinSize: data.PinSize,
    timestamp: data.Timestamp,
  };
};

const pinFile = async (fileBuffer, filename, mimeType = 'application/octet-stream') => {
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: mimeType }), filename);

  const metadata = {
    name: filename,
    keyvalues: {
      source: 'skillblock',
    },
  };

  formData.append('pinataMetadata', JSON.stringify(metadata));
  formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const headers = getAuthHeaders();
  delete headers['Content-Type'];

  const response = await fetch(`${PINATA_API_BASE}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Pinata pinFileToIPFS failed: ${response.status} ${message}`);
  }

  const data = await response.json();
  return {
    cid: data.IpfsHash,
    ipfsUri: `ipfs://${data.IpfsHash}`,
    gatewayUrl: buildGatewayUrl(data.IpfsHash),
    pinSize: data.PinSize,
    timestamp: data.Timestamp,
  };
};

module.exports = {
  pinJson,
  pinFile,
  buildGatewayUrl,
};
