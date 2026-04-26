import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isOffline: boolean;
}

const computeStatus = (state: NetInfoState): NetworkStatus => {
  const isConnected = state.isConnected === true;
  const isInternetReachable = state.isInternetReachable;
  // Treat unknown (null) reachability optimistically as online; otherwise rely on both flags.
  const isOffline = !isConnected || isInternetReachable === false;
  return { isConnected, isInternetReachable, isOffline };
};

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    isOffline: false,
  });

  useEffect(() => {
    let isMounted = true;

    NetInfo.fetch().then((state) => {
      if (isMounted) setStatus(computeStatus(state));
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (isMounted) setStatus(computeStatus(state));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return status;
}

export default useNetworkStatus;
