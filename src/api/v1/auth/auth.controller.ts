import type { Request, Response } from "express";
import { registerUser } from "../../../services/auth.service.ts";


export const register = async (req: Request, res: Response) => {
    try {
        const user = await registerUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
};