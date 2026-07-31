export interface PromptSuggestion {
  id: string;
  title: string;
  description?: string;
  prompt: string;
}

export interface PromptCommand {
  id: string;
  label: string;
  template: string;
}

export interface AIPromptProps {
  suggestions?: PromptSuggestion[];
  onSubmit: (prompt: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /**
   * Typing "/" at the start of the input opens an inline command menu when
   * this is provided; selecting a command replaces the input with its
   * template text. Omit entirely to skip the feature (no menu, "/" behaves
   * as a plain character).
   */
  commands?: PromptCommand[];
  /**
   * Clicking a suggestion card fills the input with its `prompt` text and,
   * by default, submits it immediately — the friction-reducing behavior
   * most "starter prompt" UIs use. Set to false to only fill the input and
   * let the user review/edit before sending.
   * @default true
   */
  autoSubmitOnSuggestionClick?: boolean;
  className?: string;
}
