# Consulta de Deudores BCRA

Este proyecto es una aplicación web que permite consultar la situación de deudores y cheques rechazados en el Banco Central de la República Argentina (BCRA) a partir de un archivo Excel con números de CUIT/CUIL.

## Funcionalidades

- Carga de archivo Excel con números de CUIT/CUIL.
- Consulta automática de la situación de deuda para cada CUIT/CUIL.
- Consulta automática de cheques rechazados para cada CUIT/CUIL.
- Visualización de resultados en tablas separadas para deudas y cheques rechazados.
- Interfaz con modo claro y oscuro.

## Cómo usar

Puedes usarlo directamente en el github pages:
## **[https://aolender1.github.io/IASEP-app/](https://aolender1.github.io/BCRA-API-Deudores/)**

1. Abra la aplicación en su navegador.
2. Haga clic en el botón "Seleccionar archivo Excel" y elija un archivo Excel que contenga los números de CUIT/CUIL en la columna "TipoNumeroDocumento".
3. Una vez cargado el archivo, el botón "Consultar Deuda" se habilitará.
4. Haga clic en "Consultar Deuda" para iniciar el proceso de consulta.
5. Espere a que se completen las consultas. El progreso se mostrará en la pantalla.
6. Los resultados se mostrarán en dos tablas:
   - Deudas en Situación mayor a 1
   - Cheques Rechazados
7. Use el interruptor en la esquina superior derecha para cambiar entre el modo claro y oscuro.

## Notas importantes

- La aplicación solo procesa CUIT/CUIL de 11 dígitos.
- Se muestran únicamente las deudas con situación distinta a 1.
- La información se obtiene de las APIs públicas del BCRA.
- Asegúrese de tener una conexión a Internet estable para realizar las consultas.

## Desarrollo

Este proyecto utiliza HTML, CSS y JavaScript vanilla. Para el procesamiento de archivos Excel, se utiliza la biblioteca SheetJS.

Para ejecutar el proyecto en modo de desarrollo:

1. Clone el repositorio.
2. Abra el archivo `index.html` en su navegador.

## Creditos y Contribuciones

Este proyecto fue desarrollado por **[aolender1](https://github.com/aolender1)**. Las contribuciones son bienvenidas. Por favor, abra un issue para discutir los cambios propuestos antes de realizar un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT. Consulte el archivo `LICENSE` para más detalles.
