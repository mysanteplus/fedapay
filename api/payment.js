// fedapay-proxy.js - VERSION CORRIGÉE
const { FedaPay, Transaction } = require('fedapay');

FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment(process.env.FEDAPAY_MODE === 'sandbox' ? 'sandbox' : 'live');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://app.mysanteplus.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    amount,
    description,
    customer_email,
    customer_firstname,
    customer_lastname,
    callback_url,
    cancel_url,
    metadata
  } = req.body;

  // ✅ VALIDATION DES CHAMPS OBLIGATOIRES
  if (!amount || !customer_email) {
    return res.status(400).json({ 
      error: 'Montant et email client sont requis' 
    });
  }

  try {
    const transaction = await Transaction.create({
      description: description || 'Paiement Santé Plus',
      amount: Math.round(amount),
      currency: { iso: 'XOF' },
      callback_url: callback_url || `${process.env.API_URL}/api/billing/webhook`,
      cancel_url: cancel_url || 'https://app.mysanteplus.com/#billing?status=cancel',
      customer: {
        email: customer_email,
        firstname: customer_firstname || 'Client',
        lastname: customer_lastname || 'Santé Plus'
      },
      metadata: {
        // ✅ GARANTIR QUE LES MÉTADONNÉES SONT TRANSMISES
        ...metadata,
        // ✅ AJOUTER UN TIMESTAMP POUR TRACER
        created_at: new Date().toISOString(),
        source: 'vercel-proxy'
      }
    });

    // ✅ STRUCTURE DE RÉPONSE UNIFORME
    res.json({
      success: true,
      transaction_id: transaction.id,
      payment_url: transaction.payment_url || transaction.redirect_url,
      status: transaction.status
    });

  } catch (err) {
    console.error("❌ Erreur FedaPay:", err.response?.data || err.message);
    
    // ✅ RENVOYER L'ERREUR DÉTAILLÉE POUR LE DEBUG
    res.status(500).json({ 
      error: err.message,
      details: err.response?.data || null,
      code: err.response?.status || null
    });
  }
};
