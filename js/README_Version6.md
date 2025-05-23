# Calculadora Financiera de Alta Precisión

Esta calculadora financiera obtiene los principales indicadores económicos y monedas relevantes para Chile, utilizando **APIs públicas, gratuitas y sin autenticación** para lograr la máxima precisión posible para cada dato.  
El propósito es entregar valores actualizados, confiables y transparentes, documentando claramente la fuente, el método y la frecuencia de actualización para cada indicador.

---

## **Tabla de Contenidos**
- [Fuentes de datos](#fuentes-de-datos)
- [Criterios y lógica de actualización](#criterios-y-lógica-de-actualización)
- [Indicadores soportados](#indicadores-soportados)
- [Manejo de almacenamiento local (localStorage)](#manejo-de-almacenamiento-local-localstorage)
- [Cómo funciona la conversión de monedas](#cómo-funciona-la-conversión-de-monedas)
- [Notas sobre precisión y limitaciones](#notas-sobre-precisión-y-limitaciones)
- [Estructura de archivos](#estructura-de-archivos)
- [Licencia](#licencia)

---

## **Fuentes de datos**

| Indicador      | Fuente principal                                                                                      | Frecuencia actualización | Autenticación | Detalles/Fuente oficial |
|----------------|------------------------------------------------------------------------------------------------------|-------------------------|---------------|------------------------|
| **UF**        | [mindicador.cl](https://mindicador.cl/)                                                              | Diario (Banco Central)  | No            | Oficial                |
| **UTM**       | [mindicador.cl](https://mindicador.cl/)                                                              | Diario                  | No            | Oficial                |
| **Dólar**     | [exchangerate.host](https://exchangerate.host/)                                                      | Horaria (aprox)         | No            | Mercado internacional   |
| **Euro**      | [exchangerate.host](https://exchangerate.host/)                                                      | Horaria (aprox)         | No            | Mercado internacional   |
| **Bitcoin**   | [CoinGecko](https://www.coingecko.com/en/api)                                                        | Minuto a minuto         | No            | Mercado global         |
| **Oro**       | [CoinGecko](https://www.coingecko.com/en/api) (XAUT/USD + USD/CLP de exchangerate.host)              | 2 veces al día (08:00 y 16:00) | No   | Precio internacional oro (Tether Gold/XAUT) |
| **Cobre**     | [mindicador.cl](https://mindicador.cl/)                                                              | Diario                  | No            | Banco Central (USD/lb) |
| **IPC**       | [mindicador.cl](https://mindicador.cl/)                                                              | Mensual                 | No            | Oficial                |
| **IMACEC**    | [mindicador.cl](https://mindicador.cl/)                                                              | Mensual                 | No            | Oficial                |

---

## **Criterios y lógica de actualización**

- **APIs públicas y sin autenticación:** Todas las fuentes son abiertas y no requieren registro.
- **Almacenamiento local (localStorage):**  
  Los datos se guardan localmente para minimizar las consultas y evitar bloqueos o demoras.  
  Por defecto, el sistema permite máximo 4 consultas diarias completas a las APIs para cada usuario/navegador.

- **UF, UTM, Cobre, IPC, Imacec:**  
  Se consultan una vez al día, al primer acceso, y se usan los datos almacenados para el resto del día (o hasta agotar el máximo de consultas).
  - *Fuente:* mindicador.cl (Banco Central de Chile)

- **Dólar (USD/CLP) y Euro (EUR/CLP):**  
  Se consultan siempre desde exchangerate.host, que actualiza los valores cada hora (aprox).  
  La consulta se hace en cada recarga de la calculadora, respetando el límite de consultas.

- **Bitcoin:**  
  Se consulta desde CoinGecko, que actualiza minuto a minuto.  
  Se obtiene el valor directamente en CLP.

- **Oro:**  
  Para evitar sobrecargar la fuente y basándonos en la variabilidad real del mercado, el oro se actualiza **solo 2 veces al día**:  
    - Bloque AM: cualquier acceso entre la 00:00 y 15:59 usa la cotización de las 08:00.
    - Bloque PM: cualquier acceso entre las 16:00 y 23:59 usa la cotización de las 16:00.
  - Se obtiene el precio de "Tether Gold" (XAUT) en USD desde CoinGecko, y se multiplica por el valor del dólar en CLP desde exchangerate.host.
  - Finalmente, el valor se divide por 31.1035 para entregar el precio en CLP por gramo (1 onza troy = 31.1035 gramos).

---

## **Indicadores soportados**

- **CLP**: Peso chileno, base para todas las conversiones.
- **UF**: Unidad de Fomento (mindicador.cl, diario).
- **UTM**: Unidad Tributaria Mensual (mindicador.cl, diario).
- **USD (Dólar observado)**: exchangerate.host, valor real de mercado.
- **EUR (Euro observado)**: exchangerate.host, valor real de mercado.
- **BTC (Bitcoin)**: CoinGecko, valor real de mercado en CLP.
- **Oro**: CoinGecko (Tether Gold/XAUT en USD) + exchangerate.host (USD/CLP), convertido a CLP/gramo, 2 veces al día.
- **Cobre**: Libra cobre (mindicador.cl, USD/lb).
- **IPC**: Índice de Precios al Consumidor (mensual, mindicador.cl).
- **IMACEC**: Índice Mensual de Actividad Económica (mensual, mindicador.cl).

---

## **Manejo de almacenamiento local (localStorage)**

- **Clave diaria:** Cada día, los datos se almacenan bajo una clave única con la fecha.
- **Control de consultas:**  
  Cada usuario/navegador puede realizar hasta 4 consultas completas por día (o menos si se accede fuera del horario permitido).
- **Oro:** Se almacena por bloque horario para evitar consultas innecesarias y lograr coherencia entre usuarios.

---

## **Cómo funciona la conversión de monedas**

- El usuario puede ingresar un monto en cualquiera de los campos (CLP, UF, USD, EUR, UTM).
- El sistema convierte automáticamente a las otras monedas usando los valores más recientes de cada fuente.
- Las conversiones se basan siempre en pesos chilenos como unidad de referencia.

---

## **Notas sobre precisión y limitaciones**

- **mindicador.cl:**  
  Es la única fuente oficial para UF, UTM, IPC, Imacec y cobre, pero para monedas internacionales puede mostrar desfase de varias horas.
- **exchangerate.host y CoinGecko:**  
  Son fuentes internacionales, muy precisas y sin restricciones de uso para proyectos personales o educativos.
- **Oro:**  
  El precio puede variar entre mercados y cotizaciones; la referencia usada es XAUT (Tether Gold) por ser la más accesible de forma gratuita.

- **No se usa ninguna API que requiera autenticación o pago, asegurando máxima transparencia y facilidad de mantenimiento.**

---

## **Estructura de archivos**

```
.
├── index.html
├── js/
│   └── conversor.js      # Toda la lógica de obtención y conversión de valores
├── css/
│   └── estilos.css       # Estilos visuales (opcional)
├── README.md             # Esta documentación
```

---

## **Licencia**

MIT License.

---

## **Contacto**

Para dudas, sugerencias o reportar errores, puedes contactar al autor o crear un issue en el repositorio.
