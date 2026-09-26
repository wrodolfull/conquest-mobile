import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { domainRepository } from "./domainRepository";
export function useDomains() {
  const [summary, setSummary] = useState(domainRepository.getLatest());
  useFocusEffect(
    useCallback(() => {
      let live = true;
      const refresh = () => setSummary(domainRepository.getLatest());
      const unsubscribe = domainRepository.subscribe(refresh);
      void domainRepository
        .refresh()
        .then((value) => {
          if (live) setSummary(value);
        })
        .catch(() => {});
      return () => {
        live = false;
        unsubscribe();
      };
    }, []),
  );
  return summary;
}
