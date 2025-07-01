const mangoose = require("mongoose");
const Schema = mangoose.Schema;

const forgotPasswordRequestSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
    },
    isActive: {
    type: Boolean,
    default: true,
    required: true
    }
}, {
  timestamps: true
});


// Static method to create a reset request
forgotPasswordRequestSchema.statics.createRequest = async function(userId) {
    return this.create({ userId, isActive: true });
};

// Static method to find an active reset request by UUID
forgotPasswordRequestSchema.statics.findActiveById = async function(uuid) {
    return this.findOne({ _id: uuid, isActive: true });
};

// Static method to deactivate a reset request
forgotPasswordRequestSchema.statics.deactivateById = async function(uuid) {
    return this.findByIdAndUpdate(uuid, { isActive: false });
};

const ForgotPasswordRequest = mangoose.model("ForgotPasswordRequest", forgotPasswordRequestSchema);
module.exports = ForgotPasswordRequest;


// const Sequelize = require('sequelize');
// const sequelize = require('../util/database');
// const User = require('../models/user');

// const ForgotPasswordRequest = sequelize.define('forgotPasswordRequest', {
//     id: {
//         type: Sequelize.UUID,
//         defaultValue: Sequelize.UUIDV4, // Sequelize generates UUID
//         allowNull: false,
//         primaryKey: true
//     },
//     userId: {
//         type: Sequelize.INTEGER,
//         allowNull: false,
//         references: {
//             model: User,
//             key: 'id'
//         }
//     },
//     isActive: {
//         type: Sequelize.BOOLEAN,
//         defaultValue: true,
//         allowNull: false
//     }
// });

// // Set up the relationship
// ForgotPasswordRequest.belongsTo(User, { foreignKey: 'userId' });
// User.hasMany(ForgotPasswordRequest, { foreignKey: 'userId' });

// // Correct CommonJS export
// module.exports = ForgotPasswordRequest;
