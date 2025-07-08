// Health check endpoint

export default async function handler(req, res) {
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Astra Backend API'
  });
}