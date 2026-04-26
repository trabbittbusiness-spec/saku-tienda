const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Payment, Customer, CustomerCard } = require("mercadopago");
const nodemailer = require("nodemailer");

admin.initializeApp();

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "APP_USR-1155071328413424-010512-7d8a3dad107599fffb57b12284f3bbec-1576139880";
const OWNER_EMAIL = "sakudeveloperchile@gmail.com";

const client = new MercadoPagoConfig({ 
  accessToken: ACCESS_TOKEN 
});

const payment = new Payment(client);
const customerClient = new Customer(client);
const cardClient = new CustomerCard(client);

// Configuración de Nodemailer (Usaremos una cuenta de Gmail de Saku o genérica para pruebas)
// NOTA: Para producción, se recomienda usar una App Password de Gmail o un servicio como SendGrid.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sakudeveloperchile@gmail.com',
    pass: 'xmvynrsmxfikvnhc' 
  }
});

/**
 * Trigger: Enviar correos al crear una orden.
 */
exports.onOrderCreated = onDocumentCreated("Orden/{orderId}", async (event) => {
  const order = event.data.data();
  const orderId = event.params.orderId;

  console.log(`Nueva orden detectada: ${orderId}. Enviando correos...`);

  try {
    // 1. Obtener datos del cliente
    let clientEmail = "vendedor";
    let clientName = order.nombreCliente || "Cliente";
    if (order.creadorId) {
      const userDoc = await admin.firestore().collection("users").doc(order.creadorId).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        clientEmail = uData.email || clientEmail;
        const fullName = [uData.display_name, uData.apellido].filter(Boolean).join(' ');
        if (fullName) clientName = fullName;
      }
    }

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${item.foto}" width="50" height="50" style="border-radius: 8px; object-fit: cover;" />
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; color: #111827;">${item.nombre}</div>
          <div style="font-size: 12px; color: #6B7280;">Cant: ${item.cantidad || 1} ${item.medida ? '| ' + item.medida : ''}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
          $${(item.subtotal || item.precio || 0).toLocaleString()}
        </td>
      </tr>
    `).join('');

    const emailTemplate = (isOwner) => `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #F3F4F6; border-radius: 24px; overflow: hidden; background-color: #fff;">
        <div style="background-color: ${order.isServiceBooking ? '#6366F1' : '#10B981'}; padding: 40px 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">
            ${order.isServiceBooking 
              ? (isOwner ? '¡Nuevo Servicio Reservado!' : '¡Reserva Confirmada!')
              : (isOwner ? '¡Nueva Venta Recibida!' : '¡Gracias por tu compra!')}
          </h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 10px;">${order.isServiceBooking ? 'Cita' : 'Pedido'} #${orderId.slice(-6).toUpperCase()}</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151;">${isOwner ? `Hola Administrador, has recibido un nuevo pedido de <b>${clientName}</b> (${clientEmail}).` : `Hola <b>${clientName}</b>, tu pedido en <b>Saku Tienda</b> ha sido procesado con éxito.`}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
            ${itemsHtml}
          </table>

          <div style="background-color: #F9FAFB; padding: 20px; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6B7280;">Subtotal</span>
              <span style="font-weight: bold;">$${(order.subtotal || 0).toLocaleString()}</span>
            </div>
            ${order.envio ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6B7280;">Envío</span>
              <span style="font-weight: bold;">$${(order.envio || 0).toLocaleString()}</span>
            </div>
            ` : ''}
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 15px 0;" />
            <div style="display: flex; justify-content: space-between; font-size: 20px; color: #111827;">
              <span style="font-weight: 900;">Total</span>
              <span style="font-weight: 900; color: #10B981;">$${(order.total || 0).toLocaleString()}</span>
            </div>
          </div>

          <div style="margin-top: 30px;">
            <p style="font-size: 14px; color: #6B7280;"><b>Método de Pago:</b> ${order.metodoPago === 'card' ? 'Tarjeta Bancaria' : 'Efectivo'}</p>
            ${order.isServiceBooking ? `
            <div style="background-color: #EEF2FF; padding: 20px; border-radius: 16px; margin-top: 20px; border-left: 4px solid #6366F1;">
              <h3 style="margin: 0 0 10px 0; color: #3B1E54; font-size: 16px;">Detalles de la Cita</h3>
              <p style="font-size: 14px; color: #1E293B; margin: 4px 0;"><b>Servicio:</b> ${order.items && order.items[0] ? order.items[0].nombre : 'Servicio Saku'}</p>
              <p style="font-size: 14px; color: #1E293B; margin: 4px 0;"><b>Fecha:</b> ${order.fechaReserva ? new Date(order.fechaReserva.toDate ? order.fechaReserva.toDate() : (order.fechaReserva._seconds * 1000)).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
              <p style="font-size: 14px; color: #1E293B; margin: 4px 0;"><b>Hora:</b> ${order.horaReserva || ''}</p>
              <p style="font-size: 14px; color: #1E293B; margin: 4px 0;"><b>Ubicación:</b> ${order.ubicacionCliente || 'En sucursal'}</p>
            </div>
            ` : `
            <p style="font-size: 14px; color: #6B7280;"><b>Tipo de Entrega:</b> ${order.tipoEntrega === 'home' ? 'Envío a Domicilio' : 'Retiro en Tienda'}</p>
            ${order.codigoRetiro ? `<p style="font-size: 14px; color: #111827;"><b>Código de Retiro:</b> <span style="background: #FEF3C7; padding: 4px 8px; border-radius: 4px;">${order.codigoRetiro}</span></p>` : ''}
            `}
          </div>
        </div>
        <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF;">
          Saku Tienda Chile © 2026 | Desarrollado con ❤️ por Saku Team
        </div>
      </div>
    `;

    // 2. Enviar correo al Dueño
    const subjectOwner = order.isServiceBooking 
      ? `📅 Nuevo Servicio Reservado #${orderId.slice(-6).toUpperCase()} - $${(order.total || 0).toLocaleString()}`
      : `🚨 Nueva Venta Recibida #${orderId.slice(-6).toUpperCase()} - $${(order.total || 0).toLocaleString()}`;

    await transporter.sendMail({
      from: '"Saku Tienda" <sakudeveloperchile@gmail.com>',
      to: OWNER_EMAIL,
      subject: subjectOwner,
      html: emailTemplate(true)
    });

    // 3. Enviar correo al Cliente
    const subjectClient = order.isServiceBooking
      ? `✅ Confirmación de tu Reserva #${orderId.slice(-6).toUpperCase()} - Saku`
      : `✅ Confirmación de tu Pedido #${orderId.slice(-6).toUpperCase()} - Saku`;

    if (clientEmail && clientEmail !== "vendedor") {
      await transporter.sendMail({
        from: '"Saku Tienda" <sakudeveloperchile@gmail.com>',
        to: clientEmail,
        subject: subjectClient,
        html: emailTemplate(false)
      });
    }

    console.log("Correos enviados exitosamente.");

    // 4. Enviar Notificaciones Push a los Admins
    try {
      const adminsSnap = await admin.firestore().collection("users").where("IsAdmin", "==", true).get();
      const tokens = [];

      for (const adminDoc of adminsSnap.docs) {
        const fcmSnap = await admin.firestore().collection("users").doc(adminDoc.id).collection("fcm_tokens").get();
        fcmSnap.forEach(tDoc => {
          if (tDoc.data().fcm_token) tokens.push(tDoc.data().fcm_token);
        });
      }

      if (tokens.length > 0) {
        const message = {
          notification: {
            title: order.isServiceBooking ? '🔔 Nueva Reserva de Servicio' : '📦 Nuevo Pedido Recibido',
            body: order.isServiceBooking 
              ? `${clientName} reservó ${order.items[0]?.nombre || 'un servicio'} para el ${order.horaReserva}.`
              : `${clientName} realizó un pedido por $${(order.total || 0).toLocaleString()}.`
          },
          data: {
            orderId: orderId,
            type: order.isServiceBooking ? 'service' : 'product'
          },
          tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`Notificaciones push enviadas: ${response.successCount} exitosas, ${response.failureCount} fallidas.`);
      } else {
        console.log("No se encontraron tokens de push para los administradores.");
      }
    } catch (pushErr) {
      console.error("Error al enviar notificaciones push:", pushErr);
    }

  } catch (error) {
    console.error("Error al enviar correos/notificaciones:", error);
  }
});

/**
 * Process a credit card payment.
 */
exports.processPayment = onCall({ cors: true }, async (request) => {
  const data = request.data;
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Debes estar autenticado para realizar un pago.');
  }

  console.log("Processing payment for:", auth.token.email, "Amount:", data.transaction_amount);

  try {
    const paymentBody = {
      body: {
        transaction_amount: data.transaction_amount,
        token: data.token,
        description: data.description,
        installments: data.installments || 1,
        payment_method_id: data.payment_method_id,
        issuer_id: data.issuer_id,
        payer: {
          email: data.payer.email,
          identification: data.payer.identification,
          id: data.payer.id // Mercado Pago Customer ID if available
        },
        additional_info: {
          items: data.items || [],
          payer: {
            first_name: data.payer.first_name || 'Cliente',
            last_name: data.payer.last_name || 'Saku',
          }
        },
        statement_descriptor: 'SAKU TIENDA',
        external_reference: data.external_reference || `SAKU-PAY-${Date.now()}`
      }
    };

    console.log("Payment request body:", JSON.stringify(paymentBody.body, null, 2));
    const response = await payment.create(paymentBody);
    console.log("Payment response status:", response.status);
    
    return {
      status: response.status,
      status_detail: response.status_detail,
      id: response.id
    };
  } catch (error) {
    console.error("Mercado Pago Payment Error:", error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Save a card to a customer.
 */
exports.saveCardToCustomer = onCall({ cors: true }, async (request) => {
  const data = request.data;
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Debes estar autenticado.');
  }

  try {
    const { cardToken, email } = data;
    console.log("Saving card for:", email);

    // 1. Find or Create Customer
    let customer;
    // Fix: Search requires 'filters' object in v2 SDK
    const searchResponse = await customerClient.search({ 
      filters: { email } 
    });
    
    if (searchResponse.results && searchResponse.results.length > 0) {
      customer = searchResponse.results[0];
    } else {
      customer = await customerClient.create({ body: { email } });
    }

    // 2. Associate card token with the customer
    const cardResponse = await cardClient.create({ 
      customerId: customer.id, 
      body: { token: cardToken } 
    });

    return {
      success: true,
      customerId: customer.id,
      cardId: cardResponse.id,
      last_four_digits: cardResponse.last_four_digits,
      payment_method_id: cardResponse.payment_method?.id
    };
  } catch (error) {
    console.error("Mercado Pago Save Card Error:", error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * List saved cards for a customer.
 */
exports.getCustomerCards = onCall({ cors: true }, async (request) => {
  const data = request.data;
  const auth = request.auth;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Debes estar autenticado.');
  }

  const email = data.email || auth.token.email;
  console.log("Fetching cards for:", email);

  try {
    const searchResponse = await customerClient.search({ 
      filters: { email } 
    });
    
    if (!searchResponse.results || searchResponse.results.length === 0) {
      console.log("No customer found for email:", email);
      return [];
    }

    const customerId = searchResponse.results[0].id;
    const cards = await cardClient.list({ customerId });
    console.log("Found cards count:", cards.length);
    return cards;
  } catch (error) {
    console.error("Mercado Pago List Cards Error:", error);
    // Instead of throwing, return empty list to avoid UI crash
    return [];
  }
});

/**
 * Trigger: Enviar correos masivos a suscriptores cuando se crea una campaña.
 */
exports.onNewsletterCampaignCreated = onDocumentCreated({ 
  document: "NewsletterCampaigns/{campaignId}",
  region: "us-central1"
}, async (event) => {
  console.log("Trigger fired for campaign!");
  const campaign = event.data.data();
  const campaignId = event.params.campaignId;

  console.log(`Nueva campaña detectada: ${campaignId}. Título: ${campaign?.title}. Enviando correos masivos...`);

  try {
    if (!campaign) {
      console.log("No hay datos de campaña.");
      return;
    }
    // Obtener todos los suscriptores activos
    const subscribersSnap = await admin.firestore().collection("Newsletter").where("active", "==", true).get();
    const emails = subscribersSnap.docs.map(doc => doc.data().email).filter(Boolean);

    if (emails.length === 0) {
      console.log("No hay suscriptores activos para enviar la campaña.");
      return;
    }

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #F3F4F6; border-radius: 24px; overflow: hidden; background-color: #fff;">
        <div style="background-color: #3B1E54; padding: 40px 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">${campaign.title}</h1>
        </div>
        <div style="padding: 30px;">
          <div style="font-size: 16px; color: #374151; line-height: 1.6; white-space: pre-wrap;">
            ${campaign.body.replace(/\n/g, '<br>')}
          </div>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
          <p style="font-size: 12px; color: #9CA3AF; text-align: center;">Recibiste este correo porque estás suscrito a las promociones de Saku Tienda.</p>
        </div>
        <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF;">
          Saku Tienda Chile © 2026 | Desarrollado con ❤️
        </div>
      </div>
    `;

    // Enviar correos (uno por uno para evitar bloqueos simples o usar BCC)
    for (const email of emails) {
      try {
        await transporter.sendMail({
          from: '"Saku Tienda" <sakudeveloperchile@gmail.com>',
          to: email,
          subject: campaign.title,
          html: emailHtml
        });
      } catch (err) {
        console.error(`Fallo al enviar correo a ${email}:`, err);
      }
    }

    console.log(`Campaña #${campaignId} completada. Enviada a ${emails.length} suscriptores.`);
  } catch (error) {
    console.error("Error crítico en el envío masivo:", error);
  }
});
