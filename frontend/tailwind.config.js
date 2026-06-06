export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Keep existing design tokens as aliases for safety
        ink: "#172033",
        muted: "#667085",
        brand: "#57344f", // Map old brand color to primary plum color
        accent: "#7c5071", // Map old accent color to secondary color

        // Stitch custom theme colors
        "tertiary-fixed": "#d5eab4",
        "surface-container": "#f4ecee",
        "on-tertiary-container": "#c0d5a0",
        "inverse-surface": "#342f31",
        "outline-variant": "#d1c3ca",
        "on-surface": "#1e1b1d",
        "primary-container": "#714b67",
        "tertiary": "#34451e",
        "on-primary-fixed": "#2f1029",
        "on-primary-container": "#f0bfe0",
        "outline": "#80747a",
        "on-secondary-fixed": "#310e2b",
        "surface-dim": "#e0d8da",
        "primary-fixed": "#ffd7f1",
        "on-tertiary-fixed-variant": "#3b4c24",
        "primary-fixed-dim": "#e9b8d9",
        "on-secondary": "#ffffff",
        "surface-container-low": "#faf1f4",
        "on-tertiary-fixed": "#112000",
        "on-secondary-fixed-variant": "#623958",
        "primary": "#57344f",
        "surface-container-high": "#efe6e9",
        "on-error": "#ffffff",
        "error": "#ba1a1a",
        "surface": "#fff7f9",
        "secondary-container": "#fec7ed",
        "inverse-on-surface": "#f7eef1",
        "on-primary-fixed-variant": "#5f3b56",
        "on-error-container": "#93000a",
        "tertiary-container": "#4b5d33",
        "on-tertiary": "#ffffff",
        "secondary-fixed-dim": "#edb6dc",
        "on-background": "#1e1b1d",
        "on-secondary-container": "#7b4f70",
        "secondary-fixed": "#ffd7f1",
        "background": "#fff7f9",
        "surface-variant": "#e9e0e3",
        "surface-tint": "#79526f",
        "on-primary": "#ffffff",
        "error-container": "#ffdad6",
        "surface-bright": "#fff7f9",
        "tertiary-fixed-dim": "#b9ce9a",
        "secondary": "#7c5071",
        "surface-container-lowest": "#ffffff",
        "on-surface-variant": "#4e444a",
        "inverse-primary": "#e9b8d9",
        "surface-container-highest": "#e9e0e3"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "base": "4px",
        "container-margin": "24px",
        "input-padding-x": "14px",
        "input-padding-y": "10px",
        "card-padding": "24px",
        "gutter": "16px"
      },
      fontFamily: {
        "body-main": ["Inter"],
        "small-text": ["Inter"],
        "label-bold": ["Inter"],
        "card-title": ["Inter"],
        "section-title": ["Inter"],
        "page-title-mobile": ["Inter"],
        "page-title": ["Inter"]
      },
      fontSize: {
        "body-main": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "small-text": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "label-bold": ["14px", { "lineHeight": "16px", "fontWeight": "600" }],
        "card-title": ["18px", { "lineHeight": "24px", "fontWeight": "600" }],
        "section-title": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "page-title-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "700" }],
        "page-title": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }]
      }
    }
  },
  plugins: []
};
