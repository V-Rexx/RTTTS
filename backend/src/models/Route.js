const mongoose = require('mongoose')

const routeSchema = new mongoose.Schema({

    routeNumber: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
        uppercase: true
    },

    routeName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },

    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: true
    },

    stops: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stop'
    }],

    color: {
        type: String,
        required: true,
        default: '#4F46E5',
        match: /^#[0-9A-Fa-f]{6}$/
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

routeSchema.index({ city: 1, isActive: 1 })

const Route = mongoose.model('Route', routeSchema)

module.exports = Route