const mongoose = require('mongoose')

const busSchema = new mongoose.Schema({

    busNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 20
    },

    plateNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: 20
    },

    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },

    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: true
    },

    currentLocation: {
        lat: {type: Number, default: null, min: -90, max: 90},
        lng: {type: Number, default: null, min: -180, max: 180}
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'breakdown'],
        default: 'inactive'
    },

    isOnline: {
        type: Boolean,
        default: false
    },

    lastUpdated: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

busSchema.index({ city: 1 })
busSchema.index({ route: 1, isOnline: 1 })
busSchema.index({ driver: 1 })

busSchema.methods.toLiveState = function() {
    return {
        _id: this._id,
        busNumber: this.busNumber,
        route: this.route,
        city: this.city,
        currentLocation: this.currentLocation,
        status: this.status,
        isOnline: this.isOnline,
        lastUpdated: this.lastUpdated
    }
}

const Bus = mongoose.model('Bus', busSchema)

module.exports = Bus