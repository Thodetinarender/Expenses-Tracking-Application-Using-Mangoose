const jwt = require('jsonwebtoken');
const User = require('../models/user');
const dotenv = require('dotenv');
dotenv.config();

// Generate JWT Token
const generateToken = (user) => {
    const secret = process.env.JWT_SECRET; // Fallback secret
    return jwt.sign({ id: user._id, email: user.email, isPremium: user.isPremium }, secret, { expiresIn: '1h' });
};


//  const signup = async (req, res) => {
//     const t = await sequelize.transaction(); // Start transaction
//     try {
//         const { name, email, password } = req.body;

//         if (!name || !email || !password) {
//             return res.status(400).json({ message: "Name, email, and password are required" });
//         }

//         const existingUser = await User.findOne({ where: { email }, transaction: t });
//         if (existingUser) {
//             await t.rollback();
//             return res.status(400).json({ message: "Email already in use" });
//         }

//         // Hash the password before saving
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create new user with hashed password
//         const newUser = await User.create({ name, email, password: hashedPassword },{ transaction: t});

//         await t.commit(); // Commit transaction
//         res.status(201).json({ message: "User registered successfully!", token: generateToken(newUser) });

//     } catch (error) {
//         await t.rollback(); // Rollback on error
//         console.error(error);
//         res.status(500).json({ message: "Error signing up user" });
//     }
// };

const signup = async (req, res) => {
    try {
        const newUser = await User.signup(req.body);
        res.status(201).json({ message: "User registered successfully!", token: generateToken(newUser) });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


// const signin = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             return res.status(400).json({ message: "Email and password are required" });
//         }

//         const user = await User.findOne({ email });

//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         const isPasswordValid = await bcrypt.compare(password, user.password);
//         if (!isPasswordValid) {
//             return res.status(401).json({ message: "Invalid password" });
//         }

//         // Generate token with user ID inside it
//         const token = jwt.sign(
//             { id: user.id, email: user.email, isPremium: user.isPremium },
//             process.env.JWT_SECRET,
//             { expiresIn: "1h" }
//         );

//         res.status(200).json({ message: "Login successful", token , isPremium: user.isPremium });

//     } catch (error) {
//         console.error("Sign-in error:", error);
//         res.status(500).json({ message: "Error signing in" });
//     }
// };

const signin = async (req, res) => {
    try {
        const user = await User.login(req.body);
        const token = generateToken(user);
        res.status(200).json({ message: "Login successful", token, isPremium: user.isPremium });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        console.error("Authentication failed: No token provided");
        return res.status(401).json({ message: "Access Denied! No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
       //console.log("Authenticated user:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Invalid token:", error.message);
        return res.status(403).json({ message: "Invalid token" });
    }
};





module.exports = {
    signup,
    signin,
    authenticateToken
};
