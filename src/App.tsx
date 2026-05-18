import { VaultProvider } from "./contexts/VaultContext";
import { EntryProvider } from "./contexts/EntryContext";
import { UIProvider } from "./contexts/UIContext";
import VaultGate from "./components/vault/VaultGate";
import MainLayout from "./components/layout/MainLayout";
import Toast from "./components/shared/Toast";

function App() {
  return (
    <VaultProvider>
      <VaultGate>
        <UIProvider>
          <EntryProvider>
            <MainLayout />
            <Toast />
          </EntryProvider>
        </UIProvider>
      </VaultGate>
    </VaultProvider>
  );
}

export default App;
