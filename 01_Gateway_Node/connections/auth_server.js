import express from 'express';

export function startAuthServer(port = 3000) {

    return new Promise((resolve, reject) => {

        const app = express();
        let server;

        const timeout = setTimeout(() => {
            server.close();
            reject(new Error('[AUTH] Timed out waiting for Fyers redirect.'));
        }, 2 * 60 * 1000 );

        app.get('/callback', (req, res) => {
            const authCode = req.query.auth_code;
            const status = req.query.s;

            if(!authCode || status !== 'ok') {
                clearTimeout(timeout);

                res.status(400).send(`
                    <h2>Auth Failed</h2>
                    <p>No auth code received or login was cancelled.</p>    
                `);
                server.close();
                return reject(new Error(`[AUTH] Redirect received but no valid auth code. status=${status}`));
            }

            clearTimeout(timeout);

            res.send(`
                <h2>Login sucessful</h2>    
                <p>Auth code received. you can close this tab.</p>
            `);

            server.close(() => {
                resolve(authCode);
            });
        });

        server = app.listen(port, '127.0.0.1', () => {
            console.log(`[AUTH] listening on http://127.0.0.1:${port}/callback`);
        });

        server.on("error", (err) => {
            clearTimeout(timeout);
            reject(new Error(`[AUTH] Server error: ${err.message}`));
        });
    });
}
