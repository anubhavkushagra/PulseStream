const NodeCache = require('node-cache');

// StdTTL: 10 mins, checkperiod: 2 mins
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const cacheMiddleware = (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        // console.log(`Cache Hit for ${key}`);
        return res.json(cachedResponse);
    } else {
        // console.log(`Cache Miss for ${key}`);
        res.originalSend = res.json;
        res.json = function (body) {
            if (res.headersSent) return;
            res.originalSend.call(this, body);
            cache.set(key, body);
        };
        next();
    }
};

const clearCache = (keyPattern) => {
    // Basic clearing strategy if needed
    cache.flushAll(); // simple brute force for now on mutations
};

module.exports = { cacheMiddleware, clearCache };
