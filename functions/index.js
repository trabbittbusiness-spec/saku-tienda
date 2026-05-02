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
        <div style="background-color: ${order.isServiceBooking ? '#63348C' : '#10B981'}; padding: 40px 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">
            ${order.isServiceBooking 
              ? (isOwner ? '¡Nuevo Servicio Reservado!' : '¡Reserva Confirmada!')
              : (isOwner ? '¡Nueva Venta Recibida!' : '¡Gracias por tu compra!')}
          </h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 10px;">${order.isServiceBooking ? 'Cita' : 'Pedido'} #${orderId.slice(-6).toUpperCase()}</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151;">${isOwner ? `Hola Administrador, has recibido un nuevo pedido de <b>${clientName}</b> (${clientEmail}).` : `Hola <b>${clientName}</b>, tu pedido en <b>Tienda Saku</b> ha sido procesado con éxito.`}</p>
          
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
            <div style="background-color: #EEF2FF; padding: 20px; border-radius: 16px; margin-top: 20px; border-left: 4px solid #63348C;">
              <h3 style="margin: 0 0 10px 0; color: #63348C; font-size: 16px;">Detalles de la Cita</h3>
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
          Tienda Saku Chile © 2026 | Desarrollado con ❤️ por Saku Team
        </div>
      </div>
    `;

    // 2. Enviar correo al Dueño
    const subjectOwner = order.isServiceBooking 
      ? `📅 Nuevo Servicio Reservado #${orderId.slice(-6).toUpperCase()} - $${(order.total || 0).toLocaleString()}`
      : `🚨 Nueva Venta Recibida #${orderId.slice(-6).toUpperCase()} - $${(order.total || 0).toLocaleString()}`;

    await transporter.sendMail({
      from: '"Tienda Saku" <sakudeveloperchile@gmail.com>',
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
        from: '"Tienda Saku" <sakudeveloperchile@gmail.com>',
        to: clientEmail,
        subject: subjectClient,
        html: emailTemplate(false)
      });
    }

    console.log("Correos enviados exitosamente.");

    // 4. Enviar Notificaciones Push a los Admins
    try {
      // Buscar admins (soportando booleano true y string "true")
      const adminsSnap = await admin.firestore().collection("users").get();
      const admins = adminsSnap.docs.filter(doc => {
        const data = doc.data();
        return data.IsAdmin === true || data.IsAdmin === 'true';
      });

      const tokens = [];
      console.log(`[ORDEN] Se encontraron ${admins.length} administradores potenciales.`);

      for (const adminDoc of admins) {
        const adminId = adminDoc.id;
        const fcmSnap = await admin.firestore().collection("users").doc(adminId).collection("fcm_tokens").get();
        
        if (fcmSnap.empty) {
          console.log(`[ORDEN] Admin ${adminId} no tiene tokens registrados.`);
          continue;
        }

        console.log(`[ORDEN] Admin ${adminId} tiene ${fcmSnap.size} tokens.`);
        fcmSnap.forEach(tDoc => {
          const tData = tDoc.data();
          const token = tData.fcm_token || tData.fcmToken || tData.pushToken;
          if (token) tokens.push(token);
        });
      }

      if (tokens.length > 0) {
        // Eliminar duplicados
        const uniqueTokens = [...new Set(tokens)];
        
          const message = {
            notification: {
              title: order.isServiceBooking ? '🔔 Nueva Reserva de Servicio' : '📦 Nuevo Pedido Recibido',
              body: order.isServiceBooking 
                ? `${clientName} reservó ${order.items[0]?.nombre || 'un servicio'} para el ${order.horaReserva}.`
                : `${clientName} realizó un pedido por $${(order.total || 0).toLocaleString()}.`,
              imageUrl: (order.items && order.items[0] && order.items[0].foto) 
                         ? order.items[0].foto 
                         : 'https://firebasestorage.googleapis.com/v0/b/sakuchile.appspot.com/o/logo_saku.png?alt=media' // Fallback
            },
          android: {
            notification: {
              icon: 'notification_icon',
              color: '#63348C',
              channelId: 'default',
              priority: 'high',
            }
          },
          data: {
            orderId: orderId,
            type: order.isServiceBooking ? 'service' : 'product',
            click_action: 'FLUTTER_NOTIFICATION_CLICK' // Para compatibilidad
          },
          tokens: uniqueTokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`[ORDEN] Notificaciones push procesadas: ${response.successCount} exitosas, ${response.failureCount} fallidas.`);
        
        if (response.failureCount > 0) {
          response.responses.forEach((res, idx) => {
            if (!res.success) {
              console.error(`[ORDEN] Fallo al enviar a token ${uniqueTokens[idx].slice(0, 10)}... : ${res.error.message}`);
            }
          });
        }
      } else {
        console.log("[ORDEN] No se encontraron tokens de push válidos.");
      }
    } catch (pushErr) {
      console.error("[ORDEN] Error crítico al enviar notificaciones push:", pushErr);
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
        statement_descriptor: 'TIENDA SAKU',
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
        <div style="background-color: #63348C; padding: 40px 20px; text-align: center;">
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

/**
 * Trigger: Enviar notificaciones push manuales desde el panel administrativo.
 */
exports.onPushNotificationCreated = onDocumentCreated("ff_user_push_notifications/{id}", async (event) => {
  const data = event.data.data();
  const id = event.params.id;

  if (data.status !== 'pending') return;

  console.log(`Procesando notificación push manual: ${id}`);

  try {
    const userRefs = data.user_refs; // Puede ser Array de Referencias o String
    let tokens = [];

    // 1. Obtener los IDs de usuario
    let userIds = [];
    if (Array.isArray(userRefs)) {
      userIds = userRefs.map(ref => ref.id || ref.split('/').pop());
    } else if (typeof userRefs === 'string') {
      userIds = userRefs.split(',').map(path => path.trim().split('/').pop());
    }

    // 2. Recolectar tokens de todos esos usuarios
    for (const uId of userIds) {
      console.log(`Buscando tokens para usuario: ${uId}`);
      const fcmSnap = await admin.firestore().collection("users").doc(uId).collection("fcm_tokens").get();
      console.log(`Usuario ${uId} tiene ${fcmSnap.size} tokens.`);
      fcmSnap.forEach(tDoc => {
        const token = tDoc.data().fcm_token || tDoc.data().fcmToken || tDoc.data().pushToken;
        if (token) tokens.push(token);
      });
    }

    if (tokens.length > 0) {
      const message = {
        notification: {
          title: data.notification_title || 'Tienda Saku',
          body: data.notification_text || '',
        },
        android: {
          notification: {
            icon: 'notification_icon',
            color: '#63348C',
            channelId: 'default',
          }
        },
        data: JSON.parse(data.parameter_data || '{}'),
        tokens: tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`Resultado envío manual: ${response.successCount} éxitos, ${response.failureCount} fallos.`);
      
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Fallo en token ${tokens[idx]}:`, resp.error);
        } else {
          console.log(`Éxito en token ${tokens[idx]}`);
        }
      });
      await event.data.ref.update({
        status: 'completed',
        num_sent: response.successCount,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      console.log("No se encontraron tokens para los usuarios seleccionados.");
      await event.data.ref.update({ status: 'no_tokens_found' });
    }

  } catch (error) {
    console.error("Error crítico enviando push manual:", error);
    await event.data.ref.update({ status: 'failed', error: error.message });
  }
});
