import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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
    
    console.log("fullname : ",fullname);
    
   
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
         throw new ApiError(400, "All fields are required")
    }


    const existedUser = User.findOne({
        $or: [{ email }, { username }],
    })
  
    if (existedUser) {
        throw new ApiError(409, "Username or Email already exists")
    }



    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;


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
        coverImage: coverImage.url || "",
        email,
        username: username.toLowerCase(),
        password: bcrypt.hashSync(password, 10),
        
    })

    const createdUser = await User.findById(user._id).select(
       "-password -refreshToken"
   )

    if (createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200), createdUser, "User registered successfully"
    )






})


export {registerUser}