import { Router } from "express";
import { ReviewController } from "../controllers/controllerReviews.js";

const router = Router();
const reviewController = new ReviewController();

router.post("/", (req, res) => reviewController.createReview(req, res));

router.get("/", (req, res) => reviewController.getReviews(req, res));

router.get("/:id", (req, res) => reviewController.getReviewById(req, res));

router.put("/:id", (req, res) => reviewController.updateReview(req, res));

router.delete("/:id", (req, res) => reviewController.deleteReview(req, res));

export default router;
