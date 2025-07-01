const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const userRoutes = require("./routes/userRoutes");

const expenseRoutes = require("./routes/expenseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const emailRoutes = require("./routes/emailRoutes");

const morgan = require("morgan");
//const Expense = require("./models/expense"); 
const mongoose = require("mongoose");


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//Create a write stream (in append mode) for logging requests to a file
const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });

// Setup Morgan for logging
app.use(morgan("combined", { stream: accessLogStream })); // Log to file
app.use(morgan("dev")); // Log to console

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));
app.use('/reports', express.static(path.join(__dirname, 'reports')));


// Use the combined routes
app.use("/api", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/password", emailRoutes);
app.use("/api", expenseRoutes);

// Add the UUID route first (more specific)
app.get("/password/resetpassword/:uuid", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "resetPassword.html"));
});

// Then add the general route
app.get("/resetPassword.html", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "resetPassword.html"));
});


app.get("/payment/response", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "paymentResponse.html"));
});


mongoose.connect(
  'mongodb+srv://narender:Narender123@cluster0.qbghm3r.mongodb.net/Expenses_Tracking?retryWrites=true&w=majority&appName=Cluster0'

)
.then(result =>{
  console.log('Connected to Mongoose successfully');
  app.listen(5000, () => {
    console.log(`Server running on port 5000`);
  });
})
.catch(err =>{
  console.error('Failed to connect to the database:', err.message);
});
