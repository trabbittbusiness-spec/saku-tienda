
const admin = require('firebase-admin');
const serviceAccount = require('./functions/sakuchile-firebase-adminsdk-v2.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkUser() {
  const doc = await db.collection('users').doc('fl54RZVQ8gZhyMz2c8Po34oiM3L2').get();
  if (!doc.exists) {
    console.log('Usuario no encontrado');
  } else {
    console.log(JSON.stringify(doc.data(), null, 2));
  }
}

checkUser();
