const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,       // index defined here only — removed manual index below
        trim: true,
        lowercase: true,
        validate: {
            validator: v => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v),
            message: props => `${props.value} is not a valid email!`
        }
    },
    phone: {
        type: String,
        required: true,
        unique: true,       // index defined here only
        trim: true,
        validate: {
            validator: v => /^\d{10}$/.test(v),
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['customer', 'worker', 'admin'],
        default: 'customer'
    },
    isPhoneVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked'],
        default: 'active'
    },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    lastLogin: { type: Date },
    lastLogout: { type: Date }
}, {
    timestamps: true,
    versionKey: false
});

// Only non-field indexes here
userSchema.index({ role: 1, status: 1 });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// No try/catch needed — bcrypt.compare doesn't throw on wrong password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);