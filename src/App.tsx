import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GeradorCursoProvider } from "./context/GeradorCursoContext";

import Home from "./pages/home/index";
import Novo from "./pages/novo/index";
import Editar from "./pages/editar/index";

import "./App.css";

function App() {
  return (
    <GeradorCursoProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cursos" element={<Home />} />
            <Route path="/cursos/novo" element={<Novo />} />
            <Route path="/cursos/:id" element={<Editar />} />
          </Routes>
        </div>
      </BrowserRouter>
    </GeradorCursoProvider>
  );
}

export default App;
