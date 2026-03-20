/**
 * Script para criar os atributos customizados no Brevo
 * Rodar uma vez antes de começar a receber webhooks:
 *
 *   node scripts/setup-brevo-attributes.js
 */
require('dotenv').config();
const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3';
const API_KEY = process.env.BREVO_API_KEY;

const api = axios.create({
  baseURL: BREVO_API_URL,
  headers: {
    'api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

const ATTRIBUTES = [
  // Status geral
  { category: 'normal', type: 'text', name: 'HOTMART_STATUS' },

  // Último produto comprado
  { category: 'normal', type: 'text', name: 'HOTMART_LAST_PRODUCT' },
  { category: 'normal', type: 'text', name: 'HOTMART_LAST_PRODUCT_ID' },

  // Lista de todos os produtos comprados (separados por vírgula)
  { category: 'normal', type: 'text', name: 'HOTMART_PRODUCTS' },

  // Quantidade de compras
  { category: 'normal', type: 'float', name: 'HOTMART_TOTAL_PURCHASES' },

  // Datas
  { category: 'normal', type: 'date', name: 'HOTMART_PURCHASE_DATE' },
  { category: 'normal', type: 'date', name: 'HOTMART_ABANDONED_DATE' },
  { category: 'normal', type: 'date', name: 'HOTMART_REFUND_DATE' },
  { category: 'normal', type: 'date', name: 'HOTMART_WAITING_DATE' },
  { category: 'normal', type: 'date', name: 'HOTMART_CANCEL_DATE' },
  { category: 'normal', type: 'date', name: 'HOTMART_LAST_EVENT_DATE' },

  // Transação
  { category: 'normal', type: 'text', name: 'HOTMART_TRANSACTION' },
  { category: 'normal', type: 'text', name: 'HOTMART_REFUND_TRANSACTION' },

  // Pagamento
  { category: 'normal', type: 'text', name: 'HOTMART_PAYMENT_METHOD' },
  { category: 'normal', type: 'float', name: 'HOTMART_PRICE' },
  { category: 'normal', type: 'text', name: 'HOTMART_CURRENCY' },
  { category: 'normal', type: 'text', name: 'HOTMART_OFFER_CODE' },

  // Interesse (para quem não comprou)
  { category: 'normal', type: 'text', name: 'HOTMART_INTEREST_PRODUCT' },
  { category: 'normal', type: 'text', name: 'HOTMART_INTEREST_PRODUCT_ID' },

  // Reembolso
  { category: 'normal', type: 'text', name: 'HOTMART_REFUND_PRODUCT' },

  // Assinatura
  { category: 'normal', type: 'text', name: 'HOTMART_IS_SUBSCRIPTION' },
  { category: 'normal', type: 'text', name: 'HOTMART_SUBSCRIPTION_PLAN' },
  { category: 'normal', type: 'text', name: 'HOTMART_CANCEL_PRODUCT' },

  // Último evento
  { category: 'normal', type: 'text', name: 'HOTMART_LAST_EVENT' },
];

const LISTS = [
  { name: 'Hotmart - Compradores', folderId: 1 },
  { name: 'Hotmart - Abandonaram Checkout', folderId: 1 },
  { name: 'Hotmart - Reembolsados', folderId: 1 },
  { name: 'Hotmart - Todos os Contatos', folderId: 1 },
];

async function createAttributes() {
  console.log('🔧 Criando atributos customizados no Brevo...\n');

  for (const attr of ATTRIBUTES) {
    try {
      await api.post(`/contacts/attributes/${attr.category}/${attr.name}`, {
        type: attr.type,
      });
      console.log(`  ✅ Atributo criado: ${attr.name} (${attr.type})`);
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log(`  ⏭️  Atributo já existe: ${attr.name}`);
      } else {
        console.log(`  ❌ Erro em ${attr.name}: ${error.response?.data?.message || error.message}`);
      }
    }
  }
}

async function createLists() {
  console.log('\n📋 Criando listas no Brevo...\n');

  for (const list of LISTS) {
    try {
      const response = await api.post('/contacts/lists', {
        name: list.name,
        folderId: list.folderId,
      });
      console.log(`  ✅ Lista criada: "${list.name}" (ID: ${response.data.id})`);
      console.log(`     ⚠️  ANOTAR: Atualize o .env com BREVO_LIST_*=${response.data.id}`);
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log(`  ⏭️  Lista já existe: "${list.name}"`);
      } else {
        console.log(`  ❌ Erro em "${list.name}": ${error.response?.data?.message || error.message}`);
      }
    }
  }
}

async function showExistingLists() {
  console.log('\n📋 Listas existentes no Brevo:\n');
  try {
    const response = await api.get('/contacts/lists', { params: { limit: 50, offset: 0 } });
    for (const list of response.data.lists || []) {
      console.log(`  ID: ${list.id} | Nome: "${list.name}" | Contatos: ${list.totalSubscribers}`);
    }
  } catch (error) {
    console.log(`  ❌ Erro: ${error.response?.data?.message || error.message}`);
  }
}

async function main() {
  console.log('================================================');
  console.log('  SETUP BREVO - Atributos e Listas para Hotmart');
  console.log('================================================\n');

  if (!API_KEY) {
    console.log('❌ ERRO: BREVO_API_KEY não encontrada no .env');
    process.exit(1);
  }

  await createAttributes();
  await createLists();
  await showExistingLists();

  console.log('\n================================================');
  console.log('  PRÓXIMOS PASSOS:');
  console.log('  1. Anotar os IDs das listas acima');
  console.log('  2. Atualizar o .env com os IDs corretos');
  console.log('  3. Reiniciar o container: docker compose restart');
  console.log('================================================\n');
}

main().catch(console.error);
