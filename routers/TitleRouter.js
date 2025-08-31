// routes/TitleRouter.js
import { Router } from "express";
import TitleController from "../controllers/controllerTitle.js";
import { titleValidator } from "../validators/titleValidator.js";
import validateDTO from "../middlewares/validateDTO.js";

const router = Router();

router.post("/", validateDTO(titleValidator), TitleController.create);

router.get("/", TitleController.getAll);

router.get("/:id", TitleController.getById);

router.put("/:id", validateDTO(titleValidator), TitleController.update);

router.delete("/:id", TitleController.delete);

export default router;
