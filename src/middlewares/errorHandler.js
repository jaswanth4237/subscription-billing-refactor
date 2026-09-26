function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    if (process.env.NODE_ENV !== 'test' && status === 500) {
        console.error('Unhandled Error:', err);
    }

    return res.status(status).json({
        error: message
    });
}

module.exports = errorHandler;
