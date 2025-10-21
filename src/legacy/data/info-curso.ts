import modulo from "./modulo.json";
import unidade1 from "./unidade-1.json";
import unidade2 from "./unidade-2.json";
import unidade3 from "./unidade-3.json";


const dataCurso = {
    ...modulo,
    unidades: [
        unidade1,
        unidade2,
        unidade3
    ]
}

export const infoCurso = {
    ...dataCurso,
};