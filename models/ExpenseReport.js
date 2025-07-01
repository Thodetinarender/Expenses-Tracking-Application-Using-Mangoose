const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const expenseReportSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }, 
    fileName: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Static method to get all reports for a user
expenseReportSchema.statics.getReportsForUser = async function(userId) {
    if (!userId) throw new Error("User ID is required");
    return this.find({ userId }).sort({ createdAt: -1 });
};

const ExpenseReport = mongoose.model('ExpenseReport', expenseReportSchema);
module.exports = ExpenseReport;






// // models/ExpenseReport.js
// const Sequelize = require('sequelize');
// const sequelize = require('../util/database');

// const ExpenseReport = sequelize.define('ExpenseReport', {
//     userId: {
//         type: Sequelize.INTEGER,
//         allowNull: false
//     },
//     fileName: {
//         type: Sequelize.STRING,
//         allowNull: false
//     },
//     fileUrl: {
//         type: Sequelize.TEXT,
//         allowNull: false
//     }
// });

// module.exports = ExpenseReport;
