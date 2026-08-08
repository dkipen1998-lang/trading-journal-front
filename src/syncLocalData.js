export function getPendingRemoteSyncItems({ localProfiles = [], localTrades = [], remoteProfiles = [], remoteTrades = [] }) {
  const normalizeCollection = (value) => {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.items)) return value.items;
    return [];
  };

  const normalizedRemoteProfiles = normalizeCollection(remoteProfiles);
  const normalizedRemoteTrades = normalizeCollection(remoteTrades);

  return {
    profilesToSync: normalizedRemoteProfiles.length > 0 ? [] : localProfiles,
    tradesToSync: normalizedRemoteTrades.length > 0 ? [] : localTrades,
  };
}
