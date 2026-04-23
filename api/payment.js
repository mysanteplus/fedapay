const { FedaPay, Transaction } = require('fedapay');

FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
FedaPay.setEnvironment('live');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://stevenckohr-pixel.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { amount, description, customer_email, customer_firstname, customer_lastname, callback_url, cancel_url } = req.body;
  
  try {
    const transaction = await Transaction.create({
      description,
      amount,
      currency: { iso: 'XOF' },
      callback_url,
      cancel_url,
      customer: {
        email: customer_email,
        firstname: customer_firstname,
        lastname: customer_lastname
      }
    });
    res.json({ payment_url: transaction.payment_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
