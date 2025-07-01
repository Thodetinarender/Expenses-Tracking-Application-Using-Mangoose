const express = require("express");
const userController = require("../controllers/userController");
const expenseController = require("../controllers/expenseController");
const router = express.Router();


// Protected expense routes
router.post("/add-expense", userController.authenticateToken, expenseController.addExpense);
router.get("/expenses", userController.authenticateToken, expenseController.expenses);
router.put("/edit-expense/:id", userController.authenticateToken, expenseController.editExpense);
router.delete("/expense/:id", userController.authenticateToken, expenseController.deleteExpense);
router.get("/download", userController.authenticateToken, expenseController.downloadExpense);
router.get('/reports', userController.authenticateToken, expenseController.getUserExpenseReports);

// Premium Users
router.get("/total-expenses", userController.authenticateToken, expenseController.getAllUsersTotalExpenses);

module.exports = router; 