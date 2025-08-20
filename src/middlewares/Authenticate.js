import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json({ message: err.message || "Invalid or expired token" });
    }
};
