const mangoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mangoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isPremium: {
        type: Boolean,
        default: false  // Initially NOT Premium
    },
    totalExpense: {
        type: Number,
        default: 0, // Default value is 0
        required: true
    },
    totalSalary: {
        type: Number,
        default: 0, // Default value is 0
        required: true
    }
});

// Static method for signup
UserSchema.statics.signup = async function({ name, email, password }) {
    if (!name || !email || !password) {
        throw new Error("Name, email, and password are required");
    }
    const existingUser = await this.findOne({ email });
    if (existingUser) {
        throw new Error("Email already in use");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.create({ name, email, password: hashedPassword });
};

// Static method for login
UserSchema.statics.login = async function({ email, password }) {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }
    const user = await this.findOne({ email });
    if (!user) {
        throw new Error("User not found");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid password");
    }
    return user;
};

UserSchema.statics.getAllUsersTotalExpenses = async function() {
    return this.find({}, { name: 1, totalExpense: 1 }).sort({ totalExpense: -1 });
};

// Static method to find user by email
UserSchema.statics.findByEmail = async function(email) {
    return this.findOne({ email });
};

// Static method to update password by user ID
UserSchema.statics.updatePasswordById = async function(userId, hashedPassword) {
    return this.findByIdAndUpdate(userId, { password: hashedPassword });
};

module.exports = mangoose.model("User", UserSchema);

// const Sequelize = require('sequelize');
// const sequelize = require('../util/database');

// const User = sequelize.define('user', {
//     id: {
//         type: Sequelize.INTEGER,
//         autoIncrement: true,
//         allowNull: false,
//         primaryKey: true
//     },
//     name: {
//         type: Sequelize.STRING,
//         allowNull: false
//     },
//     email: {
//         type: Sequelize.STRING,
//         allowNull: false,
//         unique: true
//     },
//     password: {
//         type: Sequelize.STRING,
//         allowNull: false
//     },
//     isPremium: {
//         type: Sequelize.BOOLEAN,
//         defaultValue: false  // Initially NOT Premium
//     },
//     totalExpense: {
//         type: Sequelize.INTEGER,
//         defaultValue: 0, // Default value is 0
//         allowNull: false
//     },
//     totalSalary: {
//         type: Sequelize.INTEGER,
//         defaultValue: 0, // Default value is 0
//         allowNull: false
//     }
// });

// module.exports = User;
