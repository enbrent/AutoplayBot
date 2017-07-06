const Youtube = require('youtube-api');
const Lien = require('lien');

const opn = require('opn');
const fs = require('fs');
const readJson = require('r-json');

module.exports = function () {
    const CREDENTIALS = readJson(`${__dirname}/client_secret.json`);

    let oauth = Youtube.authenticate({
        type: 'oauth',
        client_id: CREDENTIALS.installed.client_id,
        client_secret: CREDENTIALS.installed.client_secret,
        redirect_url: CREDENTIALS.installed.redirect_uris[0]
    });

    opn(oauth.generateAuthUrl({
        access_type: "offline"
    }));

    oauth.getToken(lien.query.code, (err, tokens) => {
        if (err) {
            lien.lien(err, 400);
            return console.err(err);
        }
        oauth.setCredentials(tokens);
    })

}