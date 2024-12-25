import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAcessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})
        
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating Access and Refresh tokens ")
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


    // todo
    // get user details from frontend
    // username or email
    //find the user
    //password check
    //generate token
    //send cookie






    const {username, email, password } = req.body  // get user details from frontend
  
    if (!username || !email) {
        throw new ApiError(400, "Username or Email are required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(401, "Invalid email or password")
    }
    const isPasswodValid = await user.isPasswordCorrect(password);
    if (!isPasswodValid) {
        throw new ApiError(401, "Invalid password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
    
        httpOnly: true,
        secure: true

    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                    
                },
                "User logged In successfully"
            )
        )
    
})


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
export {registerUser, loginUser, logOutUser}





// import { asyncHandler } from "../utils/asyncHandler.js";
// import { ApiError } from "../utils/ApiError.js";
// import { User } from "../models/user.model.js";
// import { uploadOnCloudinary } from "../utils/cloudinary.js";
// import { ApiResponse } from "../utils/ApiResponse.js";

// const registerUser = asyncHandler(async (req, res) => {
//     const { fullname, email, username, password } = req.body;

//     // Validation for required fields
//     if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
//         throw new ApiError(400, "All fields are required");
//     }

//     // Check if user with the same email or username already exists
//     const existedUser = await User.findOne({
//         $or: [{ email }, { username }],
//     });

//     if (existedUser) {
//         if (existedUser.email === email) {
//             throw new ApiError(409, "Email already registered");
//         }
//         if (existedUser.username === username) {
//             throw new ApiError(409, "Username already taken");
//         }
//     }

//     // Handle avatar and cover image uploads
//     const avatarLocalPath = req.files?.avatar[0]?.path;
//     let coverImageLocalPath;

//     if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
//         coverImageLocalPath = req.files.coverImage[0].path;
//     }

//     if (!avatarLocalPath) {
//         throw new ApiError(400, "Avatar file is required");
//     }

//     const avatar = await uploadOnCloudinary(avatarLocalPath);
//     const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

//     if (!avatar) {
//         throw new ApiError(400, "Failed to upload avatar file");
//     }

//     // Create user entry in the database
//     const user = await User.create({
//         fullname,
//         avatar: avatar.url,
//         coverImage: coverImage?.url || "",
//         email,
//         password,
//         username: username.toLowerCase(),
//     });

//     // Fetch created user without password and refresh token
//     const createdUser = await User.findById(user._id).select("-password -refreshToken");

//     if (!createdUser) {
//         throw new ApiError(500, "Something went wrong while registering the user");
//     }

//     // Send response with the created user details
//     return res.status(201).json(
//         new ApiResponse(201, createdUser, "User registered successfully")
//     );
// });

// export { registerUser };
