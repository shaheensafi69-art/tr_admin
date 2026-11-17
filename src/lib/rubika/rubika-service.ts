export async function sendRubikaNotification(
  text: string,
  chatId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const token =
    process.env.RUBIKA_BOT_TOKEN ||
    'CJFFJC0OAUVJPINPXESUNWLFWAIYFYONBAHGOLEPFXICQBQAKWXYIZEQHTURIELM';
  const targetChatId =
    chatId ||
    process.env.RUBIKA_CHAT_ID ||
    'b0DtjUc0BS1m03e2739480186618e1d4';

  if (!token || !targetChatId) {
    return { success: false, error: 'Rubika bot token or chat ID is missing.' };
  }

  try {
    const url = `https://botapi.rubika.ir/v3/${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
      }),
    });

    const result = await res.json();
    return { success: result.status === 'OK', data: result };
  } catch (err: any) {
    console.error('Rubika notification request error:', err);
    return { success: false, error: err.message };
  }
}
