import { Router } from 'express';
import { askAIGPT41Nano } from '../services/AIGPT41Nano';

/**
 * @swagger
 * tags:
 *   name: IA
 *   description: Endpoints para integración con inteligencia artificial
 */

const router = Router();

/**
 * @swagger
 * /api/AIGPT41Nano:
 *   post:
 *     summary: Consultar asistente de IA
 *     tags: [IA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Consulta o prompt para el asistente de IA
 *                 example: "Escribe un párrafo sobre inteligencia artificial"
 *     responses:
 *       200:
 *         description: Respuesta del asistente de IA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   description: Respuesta generada por la IA
 *                   example: "La inteligencia artificial es una tecnología revolucionaria..."
 *       400:
 *         description: Prompt requerido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servicio de IA
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res) => {
  const { prompt } = req.body;
  try {
    const result = await askAIGPT41Nano(prompt);
    res.json({ result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al consultar OpenAI';
    res.status(500).json({ error: message });
  }
});

export default router;
