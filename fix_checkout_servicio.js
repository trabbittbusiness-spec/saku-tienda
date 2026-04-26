const fs = require('fs');
const path = require('path');

const checkoutPath = path.join(__dirname, 'app/checkout.tsx');
const servicioPath = path.join(__dirname, 'app/checkout-servicio.tsx');

let checkoutStr = fs.readFileSync(checkoutPath, 'utf8');
let servicioStr = fs.readFileSync(servicioPath, 'utf8');

// 1. Extract fetchSavedCards and state variables from checkout.tsx
const stateVarsMatch = checkoutStr.match(/(const \[savedCards[\s\S]*?const \[selectedCardId[^\]]*\];)/);
const fetchSavedCardsMatch = checkoutStr.match(/(const fetchSavedCards = async \(\) => {[\s\S]*?};\n)/);

// 2. Add them to checkout-servicio.tsx right after `const [saveCard, setSaveCard] = useState(false);`
servicioStr = servicioStr.replace(
  `  const [saveCard, setSaveCard] = useState(false);\n`,
  `  const [saveCard, setSaveCard] = useState(false);\n\n  const [savedCards, setSavedCards] = useState<any[]>([]);\n  const [isLoadingCards, setIsLoadingCards] = useState(true);\n  const [savedCardCVV, setSavedCardCVV] = useState('');\n  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');\n\n  const fetchSavedCards = async () => {\n    if (!auth.currentUser?.uid) return;\n    setIsLoadingCards(true);\n    try {\n      const cardsSnap = await getDocs(\n        collection(db, 'users', auth.currentUser.uid, 'savedCards')\n      );\n      const cards = cardsSnap.docs.map(d => ({ id: d.id, ...d.data() }));\n      setSavedCards(cards);\n      if (cards.length > 0 && !selectedCardId && !showNewCardForm) {\n        setSelectedCardId(cards[0].id);\n      }\n    } catch (e) {\n      console.log('Error fetching saved cards:', e);\n    } finally {\n      setIsLoadingCards(false);\n    }\n  };\n\n  useEffect(() => {\n    fetchSavedCards();\n  }, []);\n\n`
);

// 3. Extract the payment loop logic from checkout.tsx
const paymentLogicMatch = checkoutStr.match(/let cardToken = null;[\s\S]*?(?=\/\/ 3\. Crear Documento Principal de la Orden)/);

if (paymentLogicMatch) {
  // We need to replace the payment logic inside checkout-servicio.tsx
  // Find the exact block in checkout-servicio.tsx
  const servicioPaymentStart = servicioStr.indexOf('let cardToken = null;');
  const servicioPaymentEnd = servicioStr.indexOf('const [h, m] = selectedHour!.split');
  
  if (servicioPaymentStart !== -1 && servicioPaymentEnd !== -1) {
    let newPaymentLogic = paymentLogicMatch[0];
    // adapt references
    newPaymentLogic = newPaymentLogic.replace(/displayTotal/g, 'service.precio');
    newPaymentLogic = newPaymentLogic.replace(/displayItems\.map\(i => i\.nombre\)\.join\(', '\)/g, 'service.nombre');
    newPaymentLogic = newPaymentLogic.replace(/displayItems\.map[\s\S]*?\}\)/g, `[{
            id: service.id || '',
            title: service.nombre || 'Servicio Saku',
            quantity: 1,
            unit_price: service.precio || 0,
            picture_url: service.foto || ''
          }]`);
    
    servicioStr = servicioStr.substring(0, servicioPaymentStart) + newPaymentLogic + '\n      ' + servicioStr.substring(servicioPaymentEnd);
  }
}

// 4. Extract the UI for payment method from checkout.tsx
const uiStart = checkoutStr.indexOf('<View style={{ marginBottom: 40 }}>\n              <Text style={{ fontSize: 18, fontWeight: \'900\', color: \'#111827\' }}>Método de Pago</Text>');
const uiEnd = checkoutStr.indexOf(' {/* ORDER SUMMARY */}');

if (uiStart !== -1 && uiEnd !== -1) {
  let newUI = checkoutStr.substring(uiStart, uiEnd);
  
  // Find where to replace in checkout-servicio.tsx
  const servUiStart = servicioStr.indexOf('<View style={[styles.sectionCard, { marginTop: 25 }]>');
  const servUiEnd = servicioStr.indexOf('</View>\n           </View>\n\n           {/* RIGHT: SUMMARY CARD */}');
  
  if (servUiStart !== -1 && servUiEnd !== -1) {
    // We replace the entire section card for payment methods
    servicioStr = servicioStr.substring(0, servUiStart) + newUI + '\n' + servicioStr.substring(servUiEnd);
  }
}

// Write it back
fs.writeFileSync(servicioPath, servicioStr, 'utf8');
console.log('Done!');
