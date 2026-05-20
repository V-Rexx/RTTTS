const jwt = require('jsonwebtoken')
const User = require('../models/User')

const authMiddleware = async (req, res, next) => {
    try {
        
        const authHeader = req.headers.authorization

        if(!authHeader){
            return res.status(401).json({message: 'No token provided'})
        }

        const token = authHeader.split(' ')[1]

        if(!token){
            return res.status(401).json({ message: 'Invalid token format '})
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId).select('-passwordHash -refreshToken')

        if(!user) {
            return res.status(401).json({ message: 'User not found '})
        }

        req.user = user 

        next()

    } catch (err) {
        
        if(err.name === 'TokenExpiredError') {
            return  res.status(401).json({ message: 'Token expired '})
        }
        return res.status(401).json({ message: 'Invalid token '})

    }
}

module.exports = authMiddleware