import { TokenExpiredError } from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";


export const verifyJWT = asyncHandler(async (req, _, next) => {
   try {
     const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
     if (!token) {
         throw new ApiError(401, "Unauthorized request")
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
     await User.findById(decodedToken?._id).select("-password -refreshToken")
 
     if (!User) {
         
         throw new ApiError(401, "Invalid Access Token")
     }
    
     req.user = User;
     next();
   } catch (error) {
       throw new ApiError(401, error?.message || "invalid access token")
    
   }
})