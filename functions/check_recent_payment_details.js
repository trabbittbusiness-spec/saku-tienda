
const { MercadoPagoConfig, Payment } = require('mercadopago');
const ACCESS_TOKEN = "APP_USR-1155071328413424-010512-7d8a3dad107599fffb57b12284f3bbec-1576139880";

async function checkDetails(id) {
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const payment = new Payment(client);
    try {
        const p = await payment.get({ id: id });
        console.log(`\n--- DETAILS FOR PAYMENT ${id} ---`);
        console.log("Status:", p.status);
        console.log("Status Detail:", p.status_detail);
        console.log("Amount:", p.transaction_amount);
        console.log("External Ref:", p.external_reference);
        console.log("Description:", p.description);
        console.log("Date Created:", p.date_created);
        if (p.additional_info?.items) {
            console.log("Items:");
            p.additional_info.items.forEach(item => {
                console.log(`  - ${item.title} | Price: ${item.unit_price} | Qty: ${item.quantity} | Image: ${item.picture_url}`);
            });
        } else {
            console.log("No item details found in additional_info.");
        }
    } catch (error) {
        console.error(`Error fetching payment ${id}:`, error.message);
    }
}

async function run() {
    await checkDetails('158834843161');
    await checkDetails('158833820281');
}

run();
