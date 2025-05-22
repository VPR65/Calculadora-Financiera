# Conversor Financiero Chile

**Conversor Financiero Chile** es una aplicación web simple que te permite convertir entre Pesos Chilenos (CLP), UF, Dólares (USD), Euros (EUR) y UTM, además de mostrar indicadores financieros relevantes para Chile como oro, cobre, bitcoin, IPC e IMACEC. Los datos pueden ser simulados o conectados a fuentes externas, como [mindicador.cl](https://mindicador.cl).

## Características

- Conversión rápida entre CLP, UF, USD, EUR y UTM.
- Muestra cotizaciones actualizadas de:
  - Peso Chileno (CLP)
  - Unidad de Fomento (UF)
  - Dólar estadounidense (USD)
  - Euro (EUR)
  - Unidad Tributaria Mensual (UTM)
  - Oro, cobre, bitcoin, IPC, IMACEC
- Formateo local de números para Chile (puntos para miles, coma para decimales).
- Interfaz responsiva y amigable.

## Estructura de archivos

```
/assets/img/logo.png       # (opcional) Logo de la aplicación
/js/conversor.js           # Lógica de la calculadora y cotizaciones
/styles/main.css           # Estilos principales
/styles/conversor.css      # Estilos adicionales para la calculadora
index.html                 # Página principal
README.md                  # Esta documentación
```

## Instalación y Uso

1. **Descarga o clona este repositorio.**
2. Asegúrate que la estructura de carpetas esté como en el esquema anterior.
3. Abre `index.html` en tu navegador preferido.
4. ¡Listo! Ya puedes usar la calculadora y ver los indicadores financieros.

## Personalización

- Para cambiar el logo, reemplaza `assets/img/logo.png` por tu imagen preferida.
- Si quieres usar datos reales, puedes modificar `js/conversor.js` para consumir APIs externas (por ejemplo, [mindicador.cl](https://mindicador.cl)).
- Los colores y estilos se pueden personalizar editando los archivos CSS.

## Créditos

- Fuentes de datos sugeridas: [mindicador.cl](https://mindicador.cl), [coingecko.com](https://coingecko.com), [metals.live](https://metals.live), [financialmodelingprep.com](https://financialmodelingprep.com), [kitco.com](https://www.kitco.com)
- Iconos: [Font Awesome](https://fontawesome.com/)

## Licencia

MIT

---
**Desarrollado por VPR65**