import { useEffect } from "react";
import { useVault } from "../../contexts/VaultContext";
import CreateVaultScreen from "./CreateVaultScreen";
import UnlockScreen from "./UnlockScreen";

export default function VaultGate({ children }: { children: React.ReactNode }) {
  const { state, refreshStatus } = useVault();

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  if (state.status === "loading") {
    return (
      <div className="h-full flex items-center justify-center bg-gh-bg">
        <div className="w-5 h-5 border-2 border-gh-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state.status === "not_created") return <CreateVaultScreen />;
  if (state.status === "locked") return <UnlockScreen />;
  return <>{children}</>;
}
