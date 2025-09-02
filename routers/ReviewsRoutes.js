import { Router } from "express";
import { ReviewController } from "../controllers/controllerReviews.js";
import { reviewsValidator } from "../middleware/validators/reviewsValidator.js";

const router = Router();
const reviewController = new ReviewController();

router.post("/create", reviewsValidator,reviewController.create);

router.get("/list", reviewController.list);

router.get("/:id", reviewController.getById);

router.put("/:id", reviewsValidator,reviewController.update);

router.delete("/:id", reviewController.delete);

router.put("/like/:id", reviewController.like);

router.put("/dislike/:id", reviewController.dislike);

router.get("/ranking/:titleId", ReviewController.calculateRanking);

export default router;
