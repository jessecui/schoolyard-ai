import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const fonts = {
  heading: "Red Hat Display",
  body: "Nunito Sans",
};

const styles = {
  global: {
    "html, body": {
      background: "#F4F4F4",
    },
    html: {
      overflow: "-moz-scrollbars-vertical",
      overflowY: "scroll",
    },
  },
};

const colors = {
  grayMain: "#707F95",
  grayLight: "#E8E8E8",
  iris: "#5565F6",
  irisDark: "#2A327B",
  mint: "#3AD69E",
  blueSky: "#1B91FF",
};

const fontSizes = {
  xl: "16px",
  lg: "15px",
  md: "14px",
  sm: "13px",
  xs: "12px"
}

const theme = extendTheme({ config, fonts, styles, colors, fontSizes });

export default theme;
