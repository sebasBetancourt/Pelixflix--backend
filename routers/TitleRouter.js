import { Router } from "express";
import TitleController from "../controllers/controllerTitle.js";
import { titleValidator } from "../middleware/validators/titlesValidator.js";
import { validatorFieldsDTO } from "../middleware/validatorFieldsDTO.js";

const router = Router();
const titleController = new TitleController();

router.post("/create", titleValidator, titleController.create);

router.get("/list", titleController.list);

router.get("/:id", titleController.getById);

export default router;
