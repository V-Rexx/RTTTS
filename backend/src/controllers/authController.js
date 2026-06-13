const jwt = require('jsonwebtoken')
const User = require('../models/User')

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
  return { accessToken, refreshToken }
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000   // 7 days
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isValid = await user.comparePassword(password)
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const { accessToken, refreshToken } = generateTokens(user._id)
    user.refreshToken = refreshToken
    await user.save()

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
    res.json({
      user: user.toPublic(),
      accessToken
    })

  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded.userId)

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: 'Invalid refresh token' })
    }

    const tokens = generateTokens(user._id)
    user.refreshToken = tokens.refreshToken
    await user.save()

    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS)
    res.json({ accessToken: tokens.accessToken })

  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' })
  }
}

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
        await User.findByIdAndUpdate(decoded.userId, { refreshToken: null })
      } catch (err) {
       
      }
    }
    res.clearCookie('refreshToken')
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    res.clearCookie('refreshToken')
    res.json({ message: 'Logged out' })
  }
}

const me = async (req, res) => {
  res.json({ user: req.user.toPublic() })
}

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    if (!['driver', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const user = new User({
      name,
      email,
      passwordHash: password,
      role
    })
    await user.save()

    res.status(201).json({ user: user.toPublic() })

  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  login,
  refresh,
  logout,
  me,
  register
}