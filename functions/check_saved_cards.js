const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Use service account from GOOGLE_APPLICATION_CREDENTIALS or firebase-admin auto-detection
const serviceAccount = require('../.firebase/sakuchile-adminsdk.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function checkSavedCards() {
  try {
    const usersSnap = await db.collection('users').get();
    console.log(`Total users: ${usersSnap.size}`);
    let found = false;
    for (const userDoc of usersSnap.docs) {
      const cardsSnap = await db.collection('users').doc(userDoc.id).collection('savedCards').get();
      if (cardsSnap.size > 0) {
        found = true;
        console.log(`\n✅ User: ${userDoc.data().email || userDoc.id}`);
        cardsSnap.docs.forEach(card => {
          const c = card.data();
          console.log(`   💳 ${(c.brand||'CARD').toUpperCase()} •••• ${c.last4} | ${c.expMonth}/${c.expYear} | ${c.holderName} | Guardada: ${c.createdAt}`);
        });
      }
    }
    if (!found) console.log('\n❌ No se encontraron tarjetas guardadas en ningún usuario.');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}
checkSavedCards();
