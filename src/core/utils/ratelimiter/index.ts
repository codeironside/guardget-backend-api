import rateLimit from "express-rate-limit";
import express from "express";







const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true, 
  legacyHeaders: false, 
  message: "Too many requests from this IP, please try again after 15 minutes.",
});

export default limiter;