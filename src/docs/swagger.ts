import { Router, type IRouter } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json" with { type: "json" };

const router: IRouter = Router();

router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;
