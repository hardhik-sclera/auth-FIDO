/* export function authenticateToken =(req, res, next)=> {
    
    });
} */
import jwt from 'jsonwebtoken'
export const isAuthorized=(req,res,next)=>{
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    console.log("authHeader: ", authHeader);
    
    console.log(token);
    
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    })
}