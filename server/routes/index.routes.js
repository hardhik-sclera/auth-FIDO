import { Router } from "express";
import authHandler from './auth.routes.js'
const router = Router();

router.use(authHandler)


export default router;