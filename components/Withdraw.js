const mongoose = require('mongoose');

const WithdrawSchema = new mongoose.Schema({
    sender: {
        type: String,
    },
    receiver: {
        type: String,
    },
    amount: {
        type: Number,
        default: 0
    },
    pending: {
        type: Boolean,
        default: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Withdraw = mongoose.model('Withdraw', WithdrawSchema);

module.exports = Withdraw;
