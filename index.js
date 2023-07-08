import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import requestLogger from "./src/midlewares/logger.js";
import errorHandler from "./src/midlewares/error.handler.js";

// @config dotenv
dotenv.config();

// @create express app
const app = express();

// @use body-parser
app.use(bodyParser.json());
app.use(requestLogger);
app.use(cors({ exposedHeaders: "Authorization" }));

// @root route
app.get("/", (req, res) => {
  res.status(200).send("<h1>Wellcome to my REST-API</h1>");
});

// @use router
import AuthRouters from "./src/controllers/authentication/routers.js";
app.use("/api/auth", AuthRouters);

//@global errorHandler
app.use(errorHandler);

// @listen to port
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
