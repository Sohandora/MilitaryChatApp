const jwt = require('jsonwebtoken');

// Verify any logged-in user
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: '❌ No token. Access denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Attach user info to request
    next();
  } catch (err) {
    return res.status(401).json({ message: '❌ Invalid token.' });
  }
};

// Only Commanders can access this route
const verifyCommander = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.rank !== 'Commander') {
      return res.status(403).json({ 
        message: '❌ Access denied. Commanders only.' 
      });
    }
    next();
  });
};

module.exports = { verifyToken, verifyCommander };