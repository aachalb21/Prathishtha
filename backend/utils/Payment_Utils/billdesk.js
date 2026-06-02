import axios from "axios";
import { encryptPayload } from "./EncrypPayload.js";
import { signPayload } from "./SigningPayload.js";
import { decryptPayload, verifyJwsPayload } from "./DecryptPayload.js";

export const createOrder = async (orderData) => {
  const BASE_URL = process.env.BILLDESK_BASE_URL || "";
  function getISTTimestamp() {
    const now = new Date();

    // Convert to IST
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const istMs = utcMs + (5 * 60 + 30) * 60000;
    const ist = new Date(istMs);

    const pad = (n) => n.toString().padStart(2, "0");

    return (
      ist.getFullYear().toString() +
      pad(ist.getMonth() + 1) +
      pad(ist.getDate()) +
      pad(ist.getHours()) +
      pad(ist.getMinutes()) +
      pad(ist.getSeconds())

    );

  }



  try {
    console.log("Creating BillDesk order with data:", orderData);
    console.log("ENC KEY LENGTH:", process.env.BILLDESK_ENCRYPTION_KEY.length);
    console.log("SIGN KEY LENGTH:", process.env.BILLDESK_SIGNING_KEY.length);
    const encryptedPayload = await encryptPayload(orderData);
    const signedPayload = await signPayload(encryptedPayload);
    const jweHeader = JSON.parse(
      Buffer.from(encryptedPayload.split(".")[0], "base64").toString(),
    );

    console.log("🔎 JWE HEADER SENT TO BILLDESK:", jweHeader);
    // Format BD-Timestamp as YYYY-MM-DDTHH:mm:ss+05:30 (IST)


    const response = await axios.post(
      BASE_URL + "/payments/ve1_2/orders/create",
      signedPayload,
      {
        headers: {
          "Content-Type": "application/jose",
          Accept: "application/jose",
          "BD-Traceid": `trace_${Date.now()}`,
          "BD-Timestamp": getISTTimestamp(),
        },
      },
    );
    console.log("BillDesk create order response:", response.data);
    const jws = await verifyJwsPayload(response.data);
    const decryptedPayload = await decryptPayload(jws);
    console.log("🔓 Decrypted BillDesk response:", decryptedPayload);
    return response
  } catch (error) {
    console.error("Error creating BillDesk order");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
      console.error("Body:", error.response.data);

      // 🔐 Decrypt ONLY if response is JOSE
      const contentType = error.response.headers["content-type"];

      if (contentType && contentType.includes("application/jose")) {
        try {
          const jws = await verifyJwsPayload(error.response.data);
          const decryptedPayload = await decryptPayload(jws);
          console.error("🔓 Decrypted BillDesk error:", decryptedPayload);
        } catch (e) {
          console.error("Failed to decrypt BillDesk error:", e.message);
        }
      }
    } else {
      console.error(error.message);
    }

    throw error;
  }
};

export const createOrderPayload = (orderData) => {

  function getISTOrderDate() {
    const now = new Date();

    // Convert to UTC
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;

    // Add IST offset
    const istMs = utcMs + (5 * 60 + 30) * 60000;
    const ist = new Date(istMs);

    const pad = (n) => n.toString().padStart(2, "0");

    return (
      ist.getFullYear() +
      "-" +
      pad(ist.getMonth() + 1) +
      "-" +
      pad(ist.getDate()) +
      "T" +
      pad(ist.getHours()) +
      ":" +
      pad(ist.getMinutes()) +
      ":" +
      pad(ist.getSeconds()) +
      "+05:30"
    );
  }
  const {
    orderId,
    amount,
    currency = "356",
    customerName,
    customerEmail,
    customerPhone,
    returnUrl,
    additionalInfo = {},
  } = orderData;

  return {
    mercid: process.env.BILLDESK_MERCHANT_ID,
    orderid: orderId,
    amount: amount.toFixed(2), // BillDesk expects amount as string with 2 decimals
    order_date: getISTOrderDate(),
    currency: "356",
    ru: returnUrl, // Return URL
    itemcode: "DIRECT",
    device: {
      init_channel: "internet",
      ip: additionalInfo.ip || "127.0.0.1",
      user_agent: additionalInfo.userAgent || "Mozilla/5.0",
      accept_header: "text/html",
      // fingerprintid: additionalInfo.fingerprintId || "",
    },
    // additional_info: {
    //   additional_info1: `${customerName || ""}`,
    //   additional_info2: `${customerEmail || ""}`,
    //   additional_info3: `${customerPhone || ""}`,
    //   additional_info4: `${additionalInfo.eventId || ""}`,
    //   additional_info5: `${additionalInfo.eventName || ""}`,
    //   additional_info6: `${additionalInfo.userId || ""}`, // STRING ONLY
    //   additional_info7: `${additionalInfo.teamId || ""}`
    // }
  };
};
