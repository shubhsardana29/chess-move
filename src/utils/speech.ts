export class SpeechManager {
  private static instance: SpeechManager;
  private speechQueue: string[] = [];
  private isSpeaking = false;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): SpeechManager {
    if (!SpeechManager.instance) {
      SpeechManager.instance = new SpeechManager();
    }
    return SpeechManager.instance;
  }

  public speak(text: string) {
    this.speechQueue.push(text);
    this.processQueue();
  }

  private processQueue() {
    if (this.isSpeaking || this.speechQueue.length === 0) return;

    const text = this.speechQueue.shift();
    if (!text) return;

    this.isSpeaking = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      this.isSpeaking = false;
      this.processQueue();
    };
    window.speechSynthesis.speak(utterance);
  }
}