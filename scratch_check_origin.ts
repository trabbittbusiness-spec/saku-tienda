import { db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function check() {
  const originSnap = await getDoc(doc(db, 'ClinicOrigin', 'origin'));
  console.log('ClinicOrigin/origin:', originSnap.data());
  
  const settingsSnap = await getDoc(doc(db, 'Settings', 'shipping'));
  console.log('Settings/shipping:', settingsSnap.data());

  const configSnap = await getDoc(doc(db, 'Configuracion', 'tienda'));
  console.log('Configuracion/tienda:', configSnap.data());
}
check();
