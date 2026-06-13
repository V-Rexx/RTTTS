const jwt = require('jsonwebtoken')
const User = require('../models/User')

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token

    if (!token) {
      return next(new Error('Authentication required'))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.userId)
      .select('-passwordHash -refreshToken')

    if (!user) {
      return next(new Error('User not found'))
    }

    if (user.role !== 'driver') {
      return next(new Error('Driver role required'))
    }

    socket.data.user = user

    next()

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new Error('Token expired'))
    }
    return next(new Error('Invalid token'))
  }
}

module.exports = socketAuthMiddleware