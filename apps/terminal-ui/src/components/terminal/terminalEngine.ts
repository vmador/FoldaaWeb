import { Terminal } from 'xterm';
import { supabase } from '@/lib/supabase';

export class TerminalEngine {
  private terminal: Terminal;
  private history: string[] = [];
  private historyIndex = -1;

  constructor(terminal: Terminal) {
    this.terminal = terminal;
    this.loadHistory();
  }

  private loadHistory() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('foldaa_terminal_history');
      if (saved) {
        this.history = JSON.parse(saved);
      }
    }
  }

  private saveHistory(command: string) {
    if (command && this.history[0] !== command) {
      this.history.unshift(command);
      if (this.history.length > 50) this.history.pop();
      localStorage.setItem('foldaa_terminal_history', JSON.stringify(this.history));
    }
    this.historyIndex = -1;
  }

  getPreviousHistory(): string | null {
    if (this.history.length === 0) return null;
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    }
    return null;
  }

  getNextHistory(): string | null {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      return this.history[this.historyIndex];
    } else if (this.historyIndex === 0) {
      this.historyIndex = -1;
      return '';
    }
    return null;
  }

  getSuggestion(input: string): string | null {
    if (!input || input.trim() === '') return null;
    
    // Find the most recent command that starts with the input
    const suggestion = this.history.find(cmd => 
      cmd.toLowerCase().startsWith(input.toLowerCase()) && 
      cmd.toLowerCase() !== input.toLowerCase()
    );
    
    return suggestion || null;
  }

  async execute(input: string, onProgress?: (data: any) => void): Promise<any> {
    const trimmedInput = input.trim().toLowerCase();
    
    // Local command interception
    if (trimmedInput === 'clear' || trimmedInput === 'cls') {
      this.saveHistory(input);
      return { success: true, local: 'clear' };
    }

    this.saveHistory(input);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/foldaa/command', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ command: input })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return { success: false, error: errorData.error || `HTTP Error ${res.status}` };
      }

      if (!res.body) {
         return { success: false, error: 'No response from server' };
      }

      const reader = res.body.getReader();
      const decoder = new TextEncoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += new TextDecoder().decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            
            if (onProgress && msg.event !== 'done' && msg.event !== 'error') {
              onProgress(msg);
            }

            if (msg.event === 'done') {
              return msg.result;
            } else if (msg.event === 'error') {
              return { success: false, error: msg.data };
            }
          } catch (e) {
             // Invalid chunk
          }
        }
      }
      
      return { success: true };
    } catch (err: any) {
        console.error('Terminal Execution Error:', err);
        return { success: false, error: err.message || 'Network error' };
    }
  }
}
