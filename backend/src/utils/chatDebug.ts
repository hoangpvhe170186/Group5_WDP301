export const chatDebug = {
  logState: (roomId: string, messages: any[], processedIds: Set<string>) => {
    console.log(`🔍 DEBUG Room ${roomId}:`, {
      messageCount: messages.length,
      lastMessages: messages.slice(-3).map(m => ({ id: m.id, text: m.text.substring(0, 20) })),
      processedIdsSize: processedIds.size,
      processedIdsSample: Array.from(processedIds).slice(0, 3)
    });
  },
  
  checkDuplicate: (roomId: string, messageId: string, text: string, sender: string, processedIds: Set<string>) => {
    const key = `${roomId}_${messageId}_${text}_${sender}`;
    const isDuplicate = processedIds.has(key);
    console.log(`🔍 DUPLICATE CHECK:`, { key, isDuplicate });
    return isDuplicate;
  }
};