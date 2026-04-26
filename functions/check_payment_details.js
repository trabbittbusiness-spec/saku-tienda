const { MercadoPagoConfig, Payment } = require('mercadopago');
const ACCESS_TOKEN = "APP_USR-1155071328413424-010512-7d8a3dad107599fffb57b12284f3bbec-1576139880";

async function checkDetails() {
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const payment = new Payment(client);
    try {
        const p = await payment.get({ id: '156459330282' });
        console.log("PAYMENT DETAILS:");
        console.log("ID:", p.id);
        console.log("Status:", p.status);
        console.log("External Ref:", p.external_reference);
        console.log("Description:", p.description);
        console.log("Statement Descriptor:", p.statement_descriptor);
        console.log("Items Count:", p.additional_info?.items?.length || 0);
        if (p.additional_info?.items) {
            p.additional_info.items.forEach(item => {
                console.log(`- Item: ${item.title} | Price: ${item.unit_price} | Qty: ${item.quantity}`);
            });
        }
    } catch (error) {
        console.error(error);
    }
}
checkDetails();
