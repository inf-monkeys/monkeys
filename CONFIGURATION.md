# Configuration <!-- omit in toc -->

- [Customization](#customization)

## Customization

| Key                                   | Description                                                               | Default Value                                      |
| ------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------- |
| `server.customization.title`          | Website Title                                                             | `Monkeys`                                          |
| `server.customization.logo`           | Website logo, can sepecify light theme logo and dark theme logo.          | `https://static.aside.fun/static/vines.svg`        |
| `server.customization.favcion`        | Website favicon, can sepecify light theme favicon and dark theme favicon. | `https://static.infmonkeys.com/upload/favicon.svg` |
| `server.customization.colors.primary` | Primary Color                                                             | `#52ad1f`                                          |


For Example:

```yaml
server:
  customization:
    title: My Monkeys App

    # Use the same logo for light theme and dark theme
    logo: https://example.com/logo.png
    # Use different logo for light theme and dark theme
    # logo:
    #   light: https://example.com/light-logo.png
    #   dark: https://example.com/dark-logo.png

    # Use the same favicon for light theme and dark them
    favicon: https://example.com/favicon.ico
    # Use different favicon for light theme and dark theme
    # favicon:
    #   light: https://example.com/light-favicon.ico
    #   dark: https://example.com/dark-favicon.ico
```
