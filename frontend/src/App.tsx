import { Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import AgentsDirectory from "@/pages/AgentsDirectory";
import Studio from "@/pages/Studio";
import Daily from "@/pages/Daily";
import Finance from "@/pages/Finance";
import Learning from "@/pages/Learning";
import Creative from "@/pages/Creative";
import Workspace from "@/pages/Workspace";
import SettingsPage from "@/pages/Settings";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agents" element={<AgentsDirectory />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/agents/daily" element={<Daily />} />
        <Route path="/agents/finance" element={<Finance />} />
        <Route path="/agents/learning" element={<Learning />} />
        <Route path="/agents/creative" element={<Creative />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
