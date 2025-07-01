const Expense = require('../models/expense');
//const { ExpenseReport } = require('../models/ExpenseReport');
const ExpenseReport = require('../models/ExpenseReport'); // Ensure the path is correct
const User = require('../models/user');
const dotenv = require('dotenv');

const fs = require("fs");
const path = require("path");
dotenv.config();


const addExpense = async (req, res) => {
    try {
        const { amount, description, category, type } = req.body;
        const userId = req.user.id;

        // Use the correct static method from the Mongoose model
        const newExpense = await Expense.addExpenseForUser({ amount, description, category, type, userId });

        res.status(201).json({ message: "Entry added successfully", expense: newExpense });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding entry", error: error.message });
    }
};


const editExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;
        const { amount, description, category } = req.body;
        const userId = req.user.id;

        const updatedExpense = await Expense.editExpenseForUser({
            expenseId,
            userId,
            amount,
            description,
            category
        });

        res.status(200).json({ message: "Expense updated successfully!", expense: updatedExpense });
    } catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).json({ message: "Error updating expense", error: error.message });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;
        const userId = req.user.id;

        await Expense.deleteExpenseForUser({ expenseId, userId });

        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting expense", error: error.message });
    }
};

const expenses = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized: User ID not found" });
        }

        // Use the model's static method
        const expenses = await Expense.getExpensesForUser(req.user.id);

        res.status(200).json(expenses);
    } catch (error) {
        console.error("Error fetching expenses:", error.message);
        res.status(500).json({ message: "Error fetching expenses", error: error.message });
    }
};

const getAllUsersTotalExpenses = async (req, res) => {
    try {
        if (!req.user.isPremium) {
            return res.status(403).json({ message: "Access Denied! Only Premium users can view this." });
        }

        // Call the model static method
        const usersTotalExpenses = await User.getAllUsersTotalExpenses();

        res.status(200).json(usersTotalExpenses);

    } catch (error) {
        console.error("Error fetching total expenses:", error.message);
        res.status(500).json({ message: "Error fetching total expenses" });
    }
};


const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
//const { expenseReportt } = require('./models');  // Adjust the path to your model

const s3 = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1", // Set default if undefined
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// Download expense report without AWS S3
const downloadExpense = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized: User ID not found" });
        }

        // Use model method to get expenses
        const expenses = await Expense.getExpensesForUser(req.user.id);

        if (expenses.length === 0) {
            return res.status(404).json({ message: "No expenses found for the user" });
        }

        const csv = convertExpensesToCSV(expenses);

        // File operations (not DB) can stay here
        const fileName = `expense_report_${req.user.id}_${Date.now()}.csv`;
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }
        const filePath = path.join(reportsDir, fileName);
        fs.writeFileSync(filePath, csv);

        // Save record in DB using model
        await ExpenseReport.create({
            userId: req.user.id,
            fileName,
            fileUrl: `/reports/${fileName}`
        });

        // Send CSV as file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.status(200).send(csv);

    } catch (error) {
        console.error("Error generating expense report:", error.message);
        res.status(500).json({ message: "Error generating expense report", error: error.message });
    }
};
const getUserExpenseReports = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized: User ID not found" });
        }

        // Use the model's static method
        const reports = await ExpenseReport.getReportsForUser(req.user.id);

        res.status(200).json(reports);

    } catch (error) {
        console.error("Error fetching expense reports:", error.message);
        res.status(500).json({ message: "Error fetching expense reports", error: error.message });
    }
};

// Helper function to convert expenses data into CSV format
function convertExpensesToCSV(expenses) {
    const headers = ['Date', 'Description', 'Category', 'Income', 'Expense'];

    const rows = expenses.map(expense => {
        const date = new Date(expense.createdAt).toLocaleDateString(); // Format the date
        const income = expense.type === 'income' ? `₹${expense.amount}` : '';
        const expenseAmount = expense.type === 'expense' ? `₹${expense.amount}` : '';
        return `${date},${expense.description},${expense.category},${income},${expenseAmount}`;
    });

    return [headers.join(','), ...rows].join('\n');
}





module.exports = {
    addExpense,
    expenses,
    editExpense,
    deleteExpense,
    getAllUsersTotalExpenses,
    downloadExpense,
    getUserExpenseReports,
    convertExpensesToCSV
    
};
