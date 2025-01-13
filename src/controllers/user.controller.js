import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation
    //check if user already exists: username or email
    //check for images
    //check for avatar
    //upload them to cloudinary
    //create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response
    
    

     const {fullname, email, username, password}= req.body
    
    // console.log("fullname : ",fullname);
    
   
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
         throw new ApiError(400, "All fields are required")
    }


    const existedUser = await User.findOne({
        $or: [{ email }, { username }],
    })
  
    if (existedUser) {
        throw new ApiError(409, "Username or Email already exists")
    }

    // console.log(req.files); 


    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
        
        
    })

    const createdUser = await User.findById(user._id).select(
       "-password -refreshToken"
   )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );





})




const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body; // Get user details from frontend
  
    if (!(username || email)) {
        throw new ApiError(400, "Username or Email are required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    // console.log("User found:", user); // Check if the user exists

    if (!user) {
        throw new ApiError(404, "Invalid Email or password (EMAIL CHAI GALAT)");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    // console.log("Is password valid:", isPasswordValid); // Log password validation result

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken,
            }, "User logged In successfully")
        );
});



const logOutUser = asyncHandler(async (req, res) => {
    
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
       },
       {
           new: true
        }
    )

    const options = {
    
        httpOnly: true,
        secure: true

    }
    return res
        .status(200)
    .clearCookie(accessToken)
        .clearCookie(refreshToken)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorised request")
    }
try {
    
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
    
        )
    
        const user = await User.findById(decodedToken?._id)
        
        if (!user) {
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }
    
    
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
               200,
              {accessToken, refreshToken: newrefreshToken},
              "Access token refreshed"
            )
    )
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
}
})




const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, } = req.body


    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")

    }
    
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password changed succesfully "))

})


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
    .json(200, req.user, "current user fetched successfully")
})


const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;

    if (!fullname || !email) {
        throw new ApiError(400, "all fields are required")
    }

   const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        { new: true}
    ).select("-password")

    return res
        .status
    .json(new ApiResponse(200, user, "Accound details updated Successfully"))



})

const updateUserAvatar = asyncHandler(async (req, res) => {
})

export {registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar}


