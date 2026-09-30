const webpush = require("web-push");

const keys = webpush.generateVAPIDKeys();
console.log('PUSH_VAPID_SUBJECT="mailto:suporte@vendamais-app.com"');
console.log(`PUSH_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`PUSH_VAPID_PRIVATE_KEY="${keys.privateKey}"`);
