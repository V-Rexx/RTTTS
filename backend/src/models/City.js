const mongoose = require('mongoose')

const citySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[a-z0-9-]+$/       //only lowecase letters, numbers, and hyphens
    },

    center: {
        lat: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        lng: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        }
    },

    zoom: {
        type: Number,
        default: 12,
        min: 1,
        max: 20
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

const City = mongoose.model('City', citySchema)

module.exports = City
