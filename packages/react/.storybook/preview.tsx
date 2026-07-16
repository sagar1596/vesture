import { useEffect } from "react";
import type { ReactNode } from "react";
import type { Decorator, Preview } from "@storybook/react-vite";
import "@vesture/tokens/styles.css";
import "@vesture/theme-retro/styles.css";
import { defaultThemeClass, vars } from "@vesture/tokens";
import { retroThemeClass } from "@vesture/theme-retro";

const THEMES = {
  default: defaultThemeClass,
  retro: retroThemeClass
} as const;

type ThemeName = keyof typeof THEMES;

// Applied to <html> (an ancestor of document.body) rather than an inner div
// so that portal-rendered content (Modal, Tooltip, Popover, DropdownMenu,
// Toast all mount into document.body) still inherits the theme's CSS
// custom properties.
function ThemeRoot({ theme, children }: { theme: ThemeName; children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    for (const className of Object.values(THEMES)) {
      root.classList.remove(className);
    }
    root.classList.add(THEMES[theme]);
  }, [theme]);

  return (
    <div
      style={{
        background: vars.color.background,
        color: vars.color.text,
        minHeight: "100vh",
        padding: vars.space.xl,
        fontFamily: vars.font.body
      }}
    >
      {children}
    </div>
  );
}

const withTheme: Decorator = (Story, context) => (
  <ThemeRoot theme={context.globals.theme ?? "default"}>
    <Story />
  </ThemeRoot>
);

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Vesture theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "default", title: "Default" },
          { value: "retro", title: "Retro" }
        ],
        dynamicTitle: true
      }
    }
  },
  initialGlobals: {
    theme: "default"
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    a11y: {
      test: "todo"
    }
  }
};

export default preview;
