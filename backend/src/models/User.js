const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

//random colors for every user created
const AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#82E0AA', '#F8C471'
]

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },

    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true   // removes leading/trailing spaces
    },

    passwordHash: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['driver', 'admin'],      //only this two values allowed
        required: true
    },

    avatarColor: {
        type: String,
        default: () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    },

    refreshToken: {
        type: String,
        default: null       //empty until they log in
    },
}, {
    timestamps: true            //adds createdAT + updatedAT
})

userSchema.pre('save', async function() {

    if(!this.isModified('passwordHash')){
        return 
    }

    this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
})

userSchema.methods.comparePassword = async function(plainPassword) {
    return await bcrypt.compare(plainPassword, this.passwordHash)
}

userSchema.methods.toPublic = function() {
    return {
        _id: this.id,
        name: this.name,
        email: this.email,
        role: this.role,
        avatarColor: this.avatarColor
    }
}

const User = mongoose.model('User', userSchema)

module.exports = User