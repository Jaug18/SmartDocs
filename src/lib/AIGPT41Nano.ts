export async function askOpenAIGPT41Nano(prompt: string): Promise<string> {
  const res = await fetch('/api/AIGPT41Nano', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  return data.result;
}
