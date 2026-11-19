import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Analyze } from "./pages/Analyze";
import { Results } from "./pages/Results";
import { History } from "./pages/History";
import { Evaluation } from "./pages/Evaluation";
import { About } from "./pages/About";

export default function App() {
  return <>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="analyze" element={<Analyze />} />
        <Route path="results/:id" element={<Results />} />
        <Route path="history" element={<History />} />
        <Route path="evaluation" element={<Evaluation />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
    <Toaster position="bottom-right" toastOptions={{ style: { background: "#14243a", color: "#e5edf5", border: "1px solid #293e59" } }} />
  </>;
}
