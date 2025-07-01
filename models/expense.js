const mongoose = require("mongoose");
const User = require("../models/user");
const Schema = mongoose.Schema;

const expenseSchema = new Schema({
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    type: {
        type: String, // income or expense
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }   
}, {
    timestamps: true
});


// Static method to add expense and update user totals
expenseSchema.statics.addExpenseForUser = async function({ amount, description, category, type, userId }) {
    if (!amount || !description || !category || !type || !userId) {
        throw new Error("amount, description, category, type, and userId are required");
    }

    // Create the expense
    const newExpense = await this.create({ amount, description, category, type, userId });

    // Update user totals
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (type === 'expense') {
        user.totalExpense += amount;
        user.totalSalary -= amount;
    } else if (type === 'income') {
        user.totalSalary += amount;
    }
    await user.save();

    return newExpense;
};

expenseSchema.statics.editExpenseForUser = async function({ expenseId, userId, amount, description, category }) {
    const expense = await this.findOne({ _id: expenseId, userId });
    if (!expense) throw new Error("Expense not found");

    // If amount or type changed, update user totals accordingly
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Calculate difference if amount changed
    const oldAmount = expense.amount;
    const diff = amount - oldAmount;

    if (expense.type === 'expense') {
        user.totalExpense += diff;
        user.totalSalary -= diff;
    } else if (expense.type === 'income') {
        user.totalSalary += diff;
    }

    // Update expense fields
    expense.amount = amount;
    expense.description = description;
    expense.category = category;

    await expense.save();
    await user.save();

    return expense;
};

// Delete expense and update user totals
expenseSchema.statics.deleteExpenseForUser = async function({ expenseId, userId }) {
    const expense = await this.findOne({ _id: expenseId, userId });
    if (!expense) throw new Error("Expense not found");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (expense.type === 'expense') {
        user.totalExpense -= expense.amount;
        user.totalSalary += expense.amount;
    } else if (expense.type === 'income') {
        user.totalSalary -= expense.amount;
    }
    await user.save();

    await expense.deleteOne();
    return;
};

// Static method to get all expenses for a user
expenseSchema.statics.getExpensesForUser = async function(userId) {
    if (!userId) throw new Error("User ID is required");
    return this.find({ userId }).sort({ createdAt: -1 });
};




const Expense = mongoose.model("Expense", expenseSchema);
module.exports = Expense;


// // models/user.js
// const Sequelize = require('sequelize');
// const sequelize = require('../util/database');
// const User = require('../models/user'); // Ensure that the path to the User model is correct


// const Expense  = sequelize.define('expense', {
//     id: {
//         type: Sequelize.INTEGER,
//         autoIncrement: true,
//         allowNull: false,
//         primaryKey: true
//     },
//     amount: {
//         type:Sequelize.INTEGER,
//         allowNull: false
//     },
//     description:{ 
//         type:Sequelize.STRING,
//         allowNull: false
//     },
//     category:{ 
//         type:Sequelize.STRING,
//         allowNull: false
//     },
//     type: {
//         type: Sequelize.STRING, // income or expense
//         allowNull: false
//     },
//     userId: {
//         type: Sequelize.INTEGER,
//         allowNull: false
//     }
// });

// // Define the relationship: One User -> Many Expenses
// User.hasMany(Expense, { foreignKey: 'userId', onDelete: 'CASCADE' });
// Expense.belongsTo(User, { foreignKey: 'userId' });

// module.exports = Expense;