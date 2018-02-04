let config = {
    port: 3000,
    auth: {
        client_id: process.env.CLIENT_ID,
        redirect_uri: process.env.REDIRECT_URI,
    },
    session: {
        secret: process.env.SESSION_SECRET
    }
};

module.exports = config;
