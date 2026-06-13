const mongoose = require('mongoose')

const stopSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 &&
                 coords[0] >= -180 && coords[0] <= 180 &&
                 coords[1] >= -90 && coords[1] <= 90
        },
        message: 'Coordinates must be [longitude, latitude]'
      }
    }
  },

  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  }

}, {
  timestamps: true
})

stopSchema.index({ location: '2dsphere' })

const Stop = mongoose.model('Stop', stopSchema)

module.exports = Stop