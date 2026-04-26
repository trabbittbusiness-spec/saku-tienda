const { MercadoPagoConfig, Payment } = require('mercadopago');
const ACCESS_TOKEN = "APP_USR-1155071328413424-010512-7d8a3dad107599fffb57b12284f3bbec-1576139880";

async function checkRejection() {
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const payment = new Payment(client);
    try {
        // Get latest payments including rejected ones
        const result = await payment.search({ options: { sort: 'date_created', criteria: 'desc', limit: 5 } });
        console.log("ÚLTIMOS PAGOS:");
        result.results.forEach(p => {
            console.log(`ID: ${p.id} | Status: ${p.status} | Detail: ${p.status_detail} | Amount: $${p.transaction_amount} | Date: ${p.date_created}`);
        });
    } catch (error) {
        console.error("Error:", error);
    }
}
checkRejection();
