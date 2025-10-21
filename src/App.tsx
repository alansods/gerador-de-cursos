import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GeradorCursoProvider } from "./context/GeradorCursoContext";

import GeradorHome from "./pages/gerador-home/index";
import GeradorNovo from "./pages/gerador-novo/index";
import GeradorEditar from "./pages/gerador-editar/index";

import "./App.css";

function App() {
  return (
    <GeradorCursoProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<GeradorHome />} />
            <Route path="/cursos" element={<GeradorHome />} />
            <Route path="/cursos/novo" element={<GeradorNovo />} />
            <Route path="/cursos/:id" element={<GeradorEditar />} />
          </Routes>
        </div>
      </BrowserRouter>
    </GeradorCursoProvider>
  );
}

export default App;
