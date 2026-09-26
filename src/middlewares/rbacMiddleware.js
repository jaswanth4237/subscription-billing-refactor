function requireRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.roles || !Array.isArray(req.user.roles)) {
            return res.status(403).json({ error: 'Forbidden: Access denied' });
        }

        const hasRole = req.user.roles.some(role => allowedRoles.includes(role));

        if (!hasRole) {
            return res.status(403).json({ error: 'Forbidden: Required role missing' });
        }

        next();
    };
}

module.exports = {
    requireRoles
};
