import { body } from "express-validator";

export const titleValidator = [
  body("title")
    .isString().withMessage("El título debe ser texto")
    .isLength({ min: 2, max: 100 }).withMessage("El título debe tener entre 2 y 100 caracteres"),

  body("description")
    .isString().withMessage("La descripción debe ser texto")
    .isLength({ min: 10, max: 1000 }).withMessage("La descripción debe tener entre 10 y 1000 caracteres"),

  body("type")
    .isIn(["movie", "tv", "anime"]).withMessage("El tipo debe ser 'movie', 'tv' o 'anime'"),

  body("temps")
    .if(body("type").isIn(["tv", "anime"])) // Solo requerido en tv/anime
    .isInt({ min: 1 }).withMessage("Las temporadas deben ser un número entero mayor a 0"),

  body("eps")
    .if(body("type").isIn(["tv", "anime"])) // Solo requerido en tv/anime
    .isInt({ min: 1 }).withMessage("Los episodios deben ser un número entero mayor a 0"),

  body("temps")
    .if(body("type").equals("movie")) // Si es movie, no debe existir
    .not().exists().withMessage("Una película no debe tener temporadas"),

  body("eps")
    .if(body("type").equals("movie"))
    .not().exists().withMessage("Una película no debe tener episodios"),
];
