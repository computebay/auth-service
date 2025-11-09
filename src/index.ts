import express from "express";
// import cors from "cors";
import routes from "./api/v1/index";
import type { Request, Response } from "express";
import logger from "./libs/logger";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors());

app.use("/api/v1", routes);

app.get("/", (req: Request, res: Response) => {
    res.send("Auth API is running...");
});

app.listen(3000, () => {
    logger.info("Server is running on http://localhost:3000");
});
