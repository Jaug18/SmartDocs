import { Router } from 'express';
import { askClaude } from '../services/anthropicService';

const router = Router();

router.post('/claude', async (req, res) => {
  const { prompt } = req.body;
  try {
    const result = await askClaude(prompt);
    res.json({ result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al consultar OpenAI' });
  }
});

export default router;
