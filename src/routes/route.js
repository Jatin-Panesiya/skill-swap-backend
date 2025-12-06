import { Router } from "express";
import userRouter from "./user.routes.js";
import matchRouter from "./match.routes.js";
import messageRouter from "./message.routes.js";
import bookingRouter from "./booking.routes.js";

const mainRouter = Router();

mainRouter.use("/users", userRouter);
mainRouter.use("/matches", matchRouter);
mainRouter.use("/messages", messageRouter);
mainRouter.use("/bookings", bookingRouter);

export default mainRouter;
