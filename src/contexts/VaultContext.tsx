import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { invoke } from "../lib/invoke";

type VaultState =
  | { status: "loading" }
  | { status: "not_created" }
  | { status: "locked" }
  | { status: "unlocked" };

interface VaultContextType {
  state: VaultState;
  createVault: (masterPassword: string) => Promise<void>;
  unlockVault: (masterPassword: string) => Promise<void>;
  lockVault: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const VaultContext = createContext<VaultContextType | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VaultState>({ status: "loading" });

  const refreshStatus = useCallback(async () => {
    try {
      const exists: boolean = await invoke("vault_exists");
      if (!exists) {
        setState({ status: "not_created" });
        return;
      }
      const status: { status: string } = await invoke("vault_status");
      if (status.status === "unlocked") {
        setState({ status: "unlocked" });
      } else {
        setState({ status: "locked" });
      }
    } catch {
      setState({ status: "not_created" });
    }
  }, []);

  const createVault = useCallback(async (masterPassword: string) => {
    await invoke("create_vault", { masterPassword });
    setState({ status: "unlocked" });
  }, []);

  const unlockVault = useCallback(async (masterPassword: string) => {
    await invoke("unlock_vault", { masterPassword });
    setState({ status: "unlocked" });
  }, []);

  const lockVault = useCallback(async () => {
    await invoke("lock_vault");
    setState({ status: "locked" });
  }, []);

  return (
    <VaultContext.Provider value={{ state, createVault, unlockVault, lockVault, refreshStatus }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
