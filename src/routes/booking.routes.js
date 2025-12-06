import { Router } from "express";
import {
  createBooking,
  acceptBooking,
  rejectBooking,
  getUpcomingBookings,
  getPastBookings,
  getAllBookings,
  getPendingBookings,
  cancelBooking,
} from "../controllers/booking.controller.js";
import { authenticate } from "../middlewares/Authenticate.js";

const bookingRouter = Router();

bookingRouter.post("/create", authenticate, createBooking);
bookingRouter.post("/accept", authenticate, acceptBooking);
bookingRouter.post("/reject", authenticate, rejectBooking);
bookingRouter.post("/cancel", authenticate, cancelBooking);
bookingRouter.get("/upcoming", authenticate, getUpcomingBookings);
bookingRouter.get("/past", authenticate, getPastBookings);
bookingRouter.get("/all", authenticate, getAllBookings);
bookingRouter.get("/pending", authenticate, getPendingBookings);

export default bookingRouter;

