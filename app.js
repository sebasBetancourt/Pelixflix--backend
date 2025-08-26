// imports
import dotenv from "dotenv";
import express from "express";
import swaggerUi from 'swagger-ui-express';
import swaggerDocumentJson from './swagger.json' assert {type: 'json'};
import UserRouter from "./routers/UserRouter.js";
import versionRouter from "./routers/versionRouter.js";
import { connect } from "./config/db.js";
import { limiter } from "./middlewares/limiter.js";
import passport from "passport";
import { configurePassport } from "./config/passport.js";
import authRoutes from "./routers/auth.js";
import userRoutes from "./routers/user.js";

//configs
dotenv.config();
const port = process.env.PORT || 3000;
const app = express();

app.use(passport.initialize());
configurePassport(passport);


app.use(express.json()); //Middleware de interpretacion de JSON
// app.use(limiter);

// Rutas
app.use("/users", limiter, UserRouter);
app.use("/version", versionRouter);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocumentJson));

connect().then(() => {
  app.listen(port, () => {
    console.log("http://localhost:" + port + "/api");
  });
});