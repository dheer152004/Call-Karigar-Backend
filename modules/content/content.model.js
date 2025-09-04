const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const contentSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'faq',
            'policy',
            'terms',
            'about',
            'help',
            'service_guide',
            'worker_guide',
            'announcement'
        ]
    },
    category: {
        type: String,
        required: function() {
            return this.type === 'faq' || this.type === 'help';
        },
        enum: [
            'general',
            'booking',
            'payment',
            'worker',
            'service',
            'account',
            'security'
        ]
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    priority: {
        type: Number,
        default: 0,
        description: "Higher number means higher priority in listing"
    },
    metadata: {
        seoTitle: String,
        seoDescription: String,
        keywords: [String]
    },
    visibility: {
        type: String,
        enum: ['public', 'customer', 'worker', 'admin'],
        default: 'public'
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date
    },
    createdBy: {
        type: String,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: String,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Create slug from title before saving
contentSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    next();
});

// Add text index for search functionality
contentSchema.index({ 
    title: 'text', 
    content: 'text', 
    'metadata.keywords': 'text' 
});

module.exports = mongoose.model('Content', contentSchema);
