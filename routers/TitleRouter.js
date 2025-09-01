import { Router } from "express";
import TitleController from "../controllers/controllerTitle.js";
import { titleValidator } from "../middleware/validators/titlesValidator.js";
import { validatorFieldsDTO } from "../middleware/validatorFieldsDTO.js";

const router = Router();
const titleController = new TitleController();

router.post("/create", titleValidator, titleController.create);

router.get("/list", titleValidator, TitleController.list);

export default router;
