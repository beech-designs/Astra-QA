export default function handler(req, res) {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Astra QA AI Backend',
    version: '2.0.0',
    author: 'Beech Designs'
  });
}