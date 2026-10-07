/**
 * Tailwind CSS Play CDN configuration.
 * Material 3 design tokens — colors, typography, spacing, border-radius.
 * This file is loaded by the Tailwind CDN script in index.html.
 */
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#004ac6",
        "on-primary": "#ffffff",
        "primary-container": "#2563eb",
        "on-primary-container": "#eeefff",
        "primary-fixed": "#dbe1ff",
        "primary-fixed-dim": "#b4c5ff",
        "on-primary-fixed": "#00174b",
        "on-primary-fixed-variant": "#003ea8",
        "secondary": "#006c49",
        "on-secondary": "#ffffff",
        "secondary-container": "#6cf8bb",
        "on-secondary-container": "#00714d",
        "secondary-fixed": "#6ffbbe",
        "secondary-fixed-dim": "#4edea3",
        "on-secondary-fixed": "#002113",
        "on-secondary-fixed-variant": "#005236",
        "tertiary": "#784b00",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#996100",
        "on-tertiary-container": "#ffeedd",
        "tertiary-fixed": "#ffddb8",
        "tertiary-fixed-dim": "#ffb95f",
        "on-tertiary-fixed": "#2a1700",
        "on-tertiary-fixed-variant": "#653e00",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "surface": "#faf8ff",
        "surface-dim": "#d2d9f4",
        "surface-bright": "#faf8ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f3ff",
        "surface-container": "#eaedff",
        "surface-container-high": "#e2e7ff",
        "surface-container-highest": "#dae2fd",
        "on-surface": "#131b2e",
        "on-surface-variant": "#434655",
        "outline": "#737686",
        "outline-variant": "#c3c6d7",
        "inverse-surface": "#283044",
        "inverse-on-surface": "#eef0ff",
        "inverse-primary": "#b4c5ff",
        "surface-tint": "#0053db",
        "background": "#faf8ff",
        "on-background": "#131b2e",
        "surface-variant": "#dae2fd"
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "2xl": "1.25rem",
        "full": "9999px"
      },
      spacing: {
        "gutter": "1rem",
        "margin": "1rem",
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "0.75rem",
        "space-lg": "1rem",
        "space-xl": "1.5rem"
      },
      fontFamily: {
        "sans": ["Nunito", "-apple-system", "BlinkMacSystemFont", "Helvetica Neue", "Arial", "sans-serif"],
        "mono": ["ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "Monaco", "Consolas", "monospace"],
        "label-sm": ["Nunito"],
        "label-md": ["Nunito"],
        "label-lg": ["Nunito"],
        "body-sm": ["Nunito"],
        "body-md": ["Nunito"],
        "body-lg": ["Nunito"],
        "headline-sm": ["Nunito"],
        "headline-md": ["Nunito"],
        "headline-lg": ["Nunito"],
        "display-lg": ["Nunito"],
        "code-output": ["ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "Monaco", "Consolas", "monospace"]
      },
      fontSize: {
        "label-sm": ["11px", { lineHeight: "14px", fontWeight: "500" }],
        "label-md": ["12px", { lineHeight: "16px", fontWeight: "600" }],
        "label-lg": ["14px", { lineHeight: "18px", fontWeight: "600" }],
        "body-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "headline-md": ["20px", { lineHeight: "26px", fontWeight: "600" }],
        "headline-lg": ["24px", { lineHeight: "30px", fontWeight: "700" }],
        "display-lg": ["32px", { lineHeight: "38px", fontWeight: "700" }],
        "code-output": ["13px", { lineHeight: "20px", fontWeight: "400" }]
      }
    }
  }
};
