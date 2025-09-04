import apiClient from '../api/apiClient';

export async function askOpenAIGPT41Nano(prompt: string): Promise<string> {
  const response = await apiClient.post('/api/AIGPT41Nano', { prompt });
  return response.data.result;
}
