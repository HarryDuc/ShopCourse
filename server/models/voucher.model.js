import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    maxUses: {
        type: Number,
        required: true,
        min: 1
    },
    currentUses: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Add index for faster lookups
voucherSchema.index({ code: 1 });
voucherSchema.index({ startDate: 1, endDate: 1 });

// Middleware to validate dates
voucherSchema.pre('save', function(next) {
    if (this.startDate >= this.endDate) {
        next(new Error('End date must be after start date'));
    }
    next();
});

export const Voucher = mongoose.model('Voucher', voucherSchema);