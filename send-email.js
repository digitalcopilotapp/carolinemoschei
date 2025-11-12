#!/usr/bin/env node

import pkg from "@getbrevo/brevo";
const { ApiClient, ContactsApi, TransactionalEmailsApi, CreateContact, SendSmtpEmail } = pkg;
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Brevo API client
const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  console.error("BREVO_API_KEY environment variable is required");
  process.exit(1);
}

const brevoClient = new ApiClient();
brevoClient.authentications["api-key"].apiKey = apiKey;

async function sendEmail() {
  try {
    const recipientEmail = "nbuenobrg@proton.me";
    const senderEmail = "contato@carolinemoschei.com";
    
    // 1. Verificar se o contato existe e criar se necessário
    console.log("Verificando contato...");
    const contactsApi = new ContactsApi(brevoClient);
    
    try {
      const contactResponse = await contactsApi.getContactInfo(recipientEmail);
      if (contactResponse && contactResponse.body && contactResponse.body.email) {
        console.log("Contato encontrado:", contactResponse.body.email);
      } else {
        throw new Error("Contato não encontrado");
      }
    } catch (error) {
      if (error.status === 404 || error.message === "Contato não encontrado") {
        console.log("Contato não encontrado. Criando contato...");
        const createContact = new CreateContact();
        createContact.email = recipientEmail;
        createContact.updateEnabled = true;
        
        try {
          await contactsApi.createContact(createContact);
          console.log("Contato criado com sucesso!");
        } catch (createError) {
          // Se já existe, continua
          if (createError.status !== 400) {
            console.log("Contato pode já existir, continuando...");
          }
        }
      } else {
        console.log("Erro ao verificar contato, continuando...", error.message);
      }
    }
    
    // 2. Enviar email transacional
    console.log("Enviando email...");
    const transactionalEmailsApi = new TransactionalEmailsApi(brevoClient);
    const sendSmtpEmail = new SendSmtpEmail();
    
    sendSmtpEmail.to = [{
      email: recipientEmail,
      name: "Amigo"
    }];
    
    sendSmtpEmail.subject = "Parabéns!";
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
          }
          h1 {
            color: #000000;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            color: #333333;
            font-size: 16px;
            margin-bottom: 15px;
          }
          .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Olá!</h1>
          <p>Quero te parabenizar! Você é um ótimo amigo e quero expressar minha gratidão pela nossa amizade.</p>
          <p>Obrigada por estar sempre presente e por ser uma pessoa tão especial na minha vida.</p>
          <div class="signature">
            <p>Com carinho,<br><strong>Caroline Moschei</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    sendSmtpEmail.textContent = `
Olá!

Quero te parabenizar! Você é um ótimo amigo e quero expressar minha gratidão pela nossa amizade.

Obrigada por estar sempre presente e por ser uma pessoa tão especial na minha vida.

Com carinho,
Caroline Moschei
    `;
    
    sendSmtpEmail.sender = {
      email: senderEmail,
      name: "Caroline Moschei"
    };
    
    const response = await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
    
    console.log("Email enviado com sucesso!");
    if (response && response.body) {
      if (response.body.messageId) {
        console.log("Message ID:", response.body.messageId);
      } else {
        console.log("Resposta:", JSON.stringify(response.body, null, 2));
      }
    } else {
      console.log("Email enviado! (resposta recebida)");
    }
    
  } catch (error) {
    console.error("Erro ao enviar email:", error.message);
    if (error.response) {
      console.error("Detalhes:", JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  }
}

sendEmail();
