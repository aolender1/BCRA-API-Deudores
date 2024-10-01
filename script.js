let cuitArray = [];

document.addEventListener('DOMContentLoaded', () => {
    const selectButton = document.getElementById('selectButton');
    const fileInput = document.getElementById('fileInput');
    const consultarButton = document.getElementById('consultarButton');
    const themeToggle = document.getElementById('themeToggle');

    // Manejar el evento de clic en el botón de selección
    selectButton.addEventListener('click', () => {
        fileInput.click(); // Abrir el diálogo de selección de archivos
    });

    // Manejar el evento de cambio en el campo de archivo
    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) {
            mostrarMensaje('messageDeudas', 'No se seleccionó ningún archivo.', 'error');
            console.error('No se seleccionó ningún archivo.');
            return;
        }

        mostrarMensaje('messageDeudas', 'Procesando el archivo...', 'info');
        mostrarMensaje('messageCheques', 'Procesando el archivo...', 'info');
        console.log('Archivo seleccionado:', file.name);

        try {
            cuitArray = await processExcel(file);
            console.log('CUIT/CUIL extraídos:', cuitArray);

            if (cuitArray.length > 0) {
                mostrarMensaje('messageDeudas', 'Archivo Excel cargado y procesado correctamente.', 'success');
                consultarButton.disabled = false; // Habilitar el botón de consulta
            } else {
                mostrarMensaje('messageDeudas', 'No se encontraron CUIT/CUIL válidos en la columna "TipoNumeroDocumento".', 'warning');
                consultarButton.disabled = true;
                console.warn('No se encontraron CUIT/CUIL válidos en el archivo.');
            }

            // Limpiar mensaje de cheques al cargar un nuevo archivo
            mostrarMensaje('messageCheques', '', '');
        } catch (error) {
            console.error('Error al procesar el archivo:', error);
            mostrarMensaje('messageDeudas', `Error: ${error}`, 'error');
            mostrarMensaje('messageCheques', `Error: ${error}`, 'error');
            consultarButton.disabled = true;
        }
    });

    // Manejar el evento de clic en el botón de consulta
    consultarButton.addEventListener('click', consultarDeudaUsuario);

    // Manejar el cambio de tema
    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark', themeToggle.checked);
    });

    // Verificar si el tema fue guardado anteriormente
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        themeToggle.checked = true;
        document.body.classList.add('dark');
    }

    // Guardar tema preferido
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
});

/**
 * Muestra un mensaje en el área designada con estilos según el tipo.
 * @param {string} messageDivId - ID del div de mensaje ('messageDeudas' o 'messageCheques').
 * @param {string} texto - Texto del mensaje.
 * @param {string} tipo - Tipo de mensaje: 'success', 'error', 'warning', 'info'.
 */
function mostrarMensaje(messageDivId, texto, tipo) {
    const messageDiv = document.getElementById(messageDivId);
    messageDiv.textContent = texto;

    // Remover todas las clases de tipo previamente
    messageDiv.classList.remove('success', 'error', 'warning', 'info');

    // Asignar clase según el tipo de mensaje
    if (tipo) {
        messageDiv.classList.add(tipo);
    }
}

/**
 * Procesa el archivo Excel y extrae los CUIT/CUIL válidos.
 * @param {File} file - Archivo Excel cargado por el usuario.
 * @returns {Promise<Array<string>>} - Promesa que resuelve con un array de CUIT/CUIL.
 */
function processExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Array de arrays

                console.log('Datos del Excel:', jsonData);

                // Encontrar el índice de la columna "TipoNumeroDocumento"
                const headerRow = jsonData[0];
                const tipoDocIndex = headerRow.findIndex(col => col.trim() === 'TipoNumeroDocumento');

                if (tipoDocIndex === -1) {
                    reject('No se encontró la columna "TipoNumeroDocumento".');
                    console.error('No se encontró la columna "TipoNumeroDocumento" en el Excel.');
                    return;
                }

                const cuitArray = [];

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    const tipoNumeroDocumento = row[tipoDocIndex];
                    
                    if (typeof tipoNumeroDocumento === 'string') {
                        if (tipoNumeroDocumento.startsWith('CUIT') || tipoNumeroDocumento.startsWith('CUIL')) {
                            // Extraer solo los números
                            const match = tipoNumeroDocumento.match(/\d+/g);
                            if (match) {
                                const cuit = match.join('');
                                if (cuit.length === 11) {
                                    cuitArray.push(cuit);
                                } else {
                                    console.warn(`CUIT/CUIL con longitud incorrecta en fila ${i + 1}: ${cuit}`);
                                }
                            }
                        }
                        // Omitir si empieza con DNI
                    }
                    // Omitir si el tipoNumeroDocumento no es una cadena
                }

                resolve(cuitArray);
            } catch (error) {
                console.error('Error procesando el archivo Excel:', error);
                reject('Error procesando el archivo Excel.');
            }
        };

        reader.onerror = () => {
            reject('Error leyendo el archivo.');
            console.error('Error leyendo el archivo.');
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Consulta las deudas y cheques rechazados para todos los CUIT/CUIL en el array.
 */
async function consultarDeudaUsuario() {
    if (!cuitArray || cuitArray.length === 0) {
        alert('Por favor, carga un archivo Excel con CUIT/CUIL antes de consultar.');
        console.warn('Intento de consultar deudas sin cargar CUIT/CUIL.');
        return;
    }

    // Limpiar las tablas antes de mostrar nuevos resultados
    const resultadosDeudasBody = document.querySelector('#resultadosDeudas tbody');
    const resultadosChequesBody = document.querySelector('#resultadosCheques tbody');
    resultadosDeudasBody.innerHTML = '';
    resultadosChequesBody.innerHTML = '';

    // Limpiar mensajes previos
    mostrarMensaje('messageDeudas', '', '');
    mostrarMensaje('messageCheques', '', '');

    mostrarMensaje('messageDeudas', 'Consultando situación de deudores...', 'info');
    mostrarMensaje('messageCheques', 'Consultando cheques rechazados...', 'info');
    console.log('Iniciando consultas a las APIs para los CUIT/CUIL:', cuitArray);

    // Crear un array de promesas para todas las consultas
    const promesasDeudas = cuitArray.map(cuit => consultarDeuda(cuit));
    const promesasCheques = cuitArray.map(cuit => consultarChequesRechazados(cuit));

    try {
        // Esperar a que todas las promesas de deudas y cheques se resuelvan
        const [resultadosDeudas, resultadosCheques] = await Promise.all([
            Promise.all(promesasDeudas),
            Promise.all(promesasCheques)
        ]);

        console.log('Resultados de todas las consultas de deudas:', resultadosDeudas);
        console.log('Resultados de todas las consultas de cheques rechazados:', resultadosCheques);

        let resultadosDeudasValidos = 0;
        let resultadosChequesValidos = 0;

        // Procesar resultados de deudas
        resultadosDeudas.forEach((data) => {
            const cuit = data.cuit;

            if (data.deuda.status === 404) {
                console.log(`CUIT/CUIL ${cuit}: ${data.deuda.error}`);
                return; // Ignorar este resultado
            }

            if (data.deuda.status === 200) {
                const { results } = data.deuda;

                const denominacion = results.results.denominacion;
                const identificacion = results.results.identificacion;
                const periodos = results.results.periodos;

                if (periodos && periodos.length > 0) {
                    periodos.forEach(periodo => {
                        const entidades = periodo.entidades;
                        entidades.forEach(entidad => {
                            // Asegurarnos de que 'entidad.situacion' es un número válido
                            const situacionNumero = Number(entidad.situacion);

                            if (!isNaN(situacionNumero)) {
                                if (situacionNumero !== 1) { // Solo situación 1
                                    // Crear un nuevo elemento de tabla
                                    const row = resultadosDeudasBody.insertRow();
                                    row.insertCell().textContent = denominacion || 'N/A';
                                    row.insertCell().textContent = cuit;
                                    row.insertCell().textContent = entidad.entidad;
                                    row.insertCell().textContent = situacionNumero;
                                    resultadosDeudasValidos++;
                                    console.log(`CUIT/CUIL ${cuit} incluido en la tabla de deudas.`);
                                } else {
                                    console.log(`CUIT/CUIL ${cuit} tiene situación distinta a 1: ${situacionNumero}`);
                                }
                            } else {
                                console.warn(`Situación inválida para la entidad ${entidad.entidad}:`, entidad.situacion);
                            }
                        });
                    });
                } else {
                    console.log(`No se encontraron periodos para ${cuit}.`);
                }
            } else {
                // Manejar otros códigos de estado o errores
                console.error(`Error para CUIT/CUIL ${cuit}: ${data.deuda.error}`);
            }
        });

        // Procesar resultados de cheques rechazados
        resultadosCheques.forEach((data) => {
            const cuit = data.cuit;

            if (data.cheques.status === 404) {
                console.log(`CUIT/CUIL ${cuit}: ${data.cheques.error}`);
                return; // Ignorar este resultado
            }

            if (data.cheques.status === 200) {
                const { results } = data.cheques;

                const denominacion = results.results.denominacion;
                const causales = results.results.causales;

                if (causales && causales.length > 0) {
                    causales.forEach(causalItem => {
                        const causal = causalItem.causal;
                        const entidades = causalItem.entidades;

                        if (entidades && entidades.length > 0) {
                            entidades.forEach(entidad => {
                                const detalles = entidad.detalle;
                                if (detalles && detalles.length > 0) {
                                    detalles.forEach(detalle => {
                                        const nroCheque = detalle.nroCheque || 'N/A';
                                        const fechaRechazo = detalle.fechaRechazo || 'N/A';
                                        const monto = detalle.monto || 'N/A';

                                        // Añadir una fila a la tabla de cheques rechazados
                                        const row = resultadosChequesBody.insertRow();
                                        row.insertCell().textContent = denominacion || 'N/A';
                                        row.insertCell().textContent = cuit;
                                        row.insertCell().textContent = nroCheque;
                                        row.insertCell().textContent = fechaRechazo;
                                        row.insertCell().textContent = monto;
                                        row.insertCell().textContent = causal || 'N/A';
                                        resultadosChequesValidos++;
                                        console.log(`Cheque rechazado agregado para CUIT/CUIL ${cuit}:`, detalle);
                                    });
                                } else {
                                    console.log(`No se encontraron detalles de cheques para entidad ${entidad.entidad} en CUIT/CUIL ${cuit}.`);
                                }
                            });
                        } else {
                            console.log(`No se encontraron entidades para causal ${causal} en CUIT/CUIL ${cuit}.`);
                        }
                    });
                } else {
                    console.log(`No se encontraron causales para ${cuit}.`);
                }
            } else {
                // Manejar otros códigos de estado o errores
                console.error(`Error para CUIT/CUIL ${cuit}: ${data.cheques.error}`);
            }
        });

        // Actualizar mensajes en base a resultados
        if (resultadosDeudasValidos > 0) {
            mostrarMensaje('messageDeudas', `Consulta de deudas completada. Se encontraron ${resultadosDeudasValidos} resultados válidos.`, 'success');
        } else {
            mostrarMensaje('messageDeudas', 'Consulta de deudas completada. No se encontraron deudores con situación 1.', 'warning');
            console.warn('Consulta de deudas completada. No se encontraron deudores con situación 1.');
        }

        if (resultadosChequesValidos > 0) {
            mostrarMensaje('messageCheques', `Consulta de cheques rechazados completada. Se encontraron ${resultadosChequesValidos} cheques rechazados.`, 'success');
        } else {
            mostrarMensaje('messageCheques', 'Consulta de cheques rechazados completada. No se encontraron cheques rechazados.', 'warning');
            console.warn('Consulta de cheques rechazados completada. No se encontraron cheques rechazados.');
        }
    } catch (error) {
        console.error('Error en la consulta de deudas y cheques rechazados:', error);
        mostrarMensaje('messageDeudas', 'Ocurrió un error al consultar las deudas.', 'error');
        mostrarMensaje('messageCheques', 'Ocurrió un error al consultar los cheques rechazados.', 'error');
    }
}

/**
 * Realiza una consulta a la API del BCRA para deudas de un CUIT/CUIL específico.
 * @param {string} identificacion - CUIT/CUIL de 11 dígitos.
 * @returns {Promise<Object>} - Promesa que resuelve con el resultado de la consulta.
 */
async function consultarDeuda(identificacion) {
    const baseUrl = 'https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/';

    // Validar que la identificación tenga 11 dígitos
    if (!/^\d{11}$/.test(identificacion)) {
        console.error('La identificación debe ser un número de 11 dígitos:', identificacion);
        return { 
            cuit: identificacion, 
            deuda: { status: 400, error: 'Identificación inválida' }
        }; // Retornar un objeto de error
    }

    const apiUrl = `${baseUrl}${identificacion}`;

    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // Agrega aquí otros headers si son necesarios, como token de autenticación
        }
    };

    try {
        console.log(`Realizando consulta de deudas para CUIT/CUIL: ${identificacion}`);
        const response = await fetch(apiUrl, options);
        if (!response.ok) {
            // Manejo del error 404
            if (response.status === 404) {
                return { 
                    cuit: identificacion, 
                    deuda: { status: 404, error: 'No se encontraron datos de deuda para la identificación ingresada.' }
                };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonResponse = await response.json();
        console.log(`Consulta de deuda exitosa para ${identificacion}:`, jsonResponse);
        return { 
            cuit: identificacion, 
            deuda: { status: 200, results: jsonResponse } 
        };
    } catch (error) {
        console.error(`Hubo un problema con la consulta de deudas para ${identificacion}:`, error);
        return { 
            cuit: identificacion, 
            deuda: { status: 500, error: 'Error en la consulta de deudas' }
        }; // Retornar un objeto de error
    }
}

/**
 * Realiza una consulta a la API del BCRA para cheques rechazados de un CUIT/CUIL específico.
 * @param {string} identificacion - CUIT/CUIL de 11 dígitos.
 * @returns {Promise<Object>} - Promesa que resuelve con el resultado de la consulta.
 */
async function consultarChequesRechazados(identificacion) {
    const baseUrl = 'https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/ChequesRechazados/';

    // Validar que la identificación tenga 11 dígitos
    if (!/^\d{11}$/.test(identificacion)) {
        console.error('La identificación debe ser un número de 11 dígitos:', identificacion);
        return { 
            cuit: identificacion, 
            cheques: { status: 400, error: 'Identificación inválida' }
        }; // Retornar un objeto de error
    }

    const apiUrl = `${baseUrl}${identificacion}`;

    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // Agrega aquí otros headers si son necesarios, como token de autenticación
        }
    };

    try {
        console.log(`Realizando consulta de cheques rechazados para CUIT/CUIL: ${identificacion}`);
        const response = await fetch(apiUrl, options);
        if (!response.ok) {
            // Manejo del error 404
            if (response.status === 404) {
                return { 
                    cuit: identificacion, 
                    cheques: { status: 404, error: 'No se encontraron datos de cheques rechazados para la identificación ingresada.' }
                };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonResponse = await response.json();
        console.log(`Consulta de cheques rechazados exitosa para ${identificacion}:`, jsonResponse);
        return { 
            cuit: identificacion, 
            cheques: { status: 200, results: jsonResponse } 
        };
    } catch (error) {
        console.error(`Hubo un problema con la consulta de cheques rechazados para ${identificacion}:`, error);
        return { 
            cuit: identificacion, 
            cheques: { status: 500, error: 'Error en la consulta de cheques rechazados' }
        }; // Retornar un objeto de error
    }
}