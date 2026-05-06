
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Buscar el archivo json de credenciales en la carpeta actual
const functionsDir = __dirname;
const serviceAccountFile = fs.readdirSync(functionsDir).find(f => f.endsWith('.json') && f.includes('adminsdk'));

if (!serviceAccountFile) {
  console.error('No se encontró el archivo adminsdk .json');
  process.exit(1);
}

const serviceAccount = require(path.join(functionsDir, serviceAccountFile));

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
    const data = doc.data();
    console.log('--- DATOS DEL USUARIO ---');
    console.log('Email:', data.email);
    console.log('Notification Token:', data.notificationToken);
    console.log('Expo Token:', data.expo_token);
    console.log('FCM Token:', data.fcm_token);
    console.log('Device Platform:', data.device_platform);
    console.log('Last Token Update:', data.last_token_update ? data.last_token_update.toDate().toLocaleString() : 'N/A');
    
    // Check subcollection
    const tokensSnap = await db.collection('users').doc('fl54RZVQ8gZhyMz2c8Po34oiM3L2').collection('fcm_tokens').orderBy('created_at', 'desc').limit(5).get();
    console.log('\n--- ÚLTIMOS TOKENS EN SUBCOLECCIÓN ---');
    tokensSnap.forEach(tDoc => {
      const tData = tDoc.data();
      console.log(`ID: ${tDoc.id}`);
      console.log(`  Device: ${tData.device_type}`);
      console.log(`  Created: ${tData.created_at ? tData.created_at.toDate().toLocaleString() : 'N/A'}`);
      console.log(`  Expo: ${tData.expo_token}`);
      console.log('---------------------------');
    });
  }
}

checkUser();
