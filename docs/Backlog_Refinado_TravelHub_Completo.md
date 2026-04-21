TravelHub

Backlog refinado y detallado
Historias de usuario de los sprints 1, 2 y 3


Documento listo para entrega académica

|Proyecto|MISW4501 - Proyecto Final|
|---|---|
|Componente|Backlog funcional refinado|
|Cobertura|Historias de usuario contenidas en los sprints 1, 2 y 3 del backlog|
|Criterio|Se conservaron los nombres oficiales de los ASR y solo se asociaron cuando existe relación directa.|



Nota de uso. Este documento reescribe y detalla cada historia de usuario manteniendo su intención funcional original, corrigiendo redacción, ampliando validaciones y asociando únicamente los ASR oficiales definidos en el backlog.


# SPRINT 1

Cobertura del sprint. Este sprint contiene 9 historias de usuario refinadas y detalladas.



## HU-W-17 - Búsqueda avanzada de hospedaje

|Descripción|Como viajero que utiliza la plataforma TravelHub, quiero buscar hospedaje utilizando filtros como fechas, número de habitaciones, ubicación y amenidades, para encontrar rápidamente opciones disponibles y asegurar mi hospedaje antes de que se agote la disponibilidad.|
|---|---|



### 1. Requerimientos funcionales

- El sistema debe permitir la captura de criterios de búsqueda como mínimo de ciudad o destino, fechas de estadía, número de huéspedes, número de habitaciones, rango de precio y amenidades.

- Las fechas de entrada y salida son obligatorias; la fecha de entrada no puede ser anterior a la fecha actual y la fecha de salida debe ser posterior a la fecha de entrada.

- El número de huéspedes y habitaciones debe aceptar únicamente valores enteros positivos mayores que cero.

- Cuando el usuario seleccione una ubicación, el sistema debe normalizarla para evitar búsquedas duplicadas por diferencias de mayúsculas, acentos o abreviaturas comunes.

- El sistema debe permitir agregar, quitar o modificar filtros y refrescar los resultados sin obligar a recargar la página completa.

- Cada resultado debe mostrar como mínimo nombre del hotel, ubicación, imagen principal, precio por noche, moneda, calificación si existe y disponibilidad para las fechas seleccionadas.

- Los resultados deben excluir habitaciones que ya estén comprometidas por reservas confirmadas o por holds activos para el mismo rango de fechas.

- Si no existen coincidencias, el sistema debe informar de forma clara que no se encontraron hospedajes disponibles con los filtros seleccionados y debe permitir ajustar la búsqueda.

- El usuario debe poder seleccionar un resultado para navegar al detalle del hotel sin perder el contexto de la búsqueda realizada.

### 2. Requerimientos no funcionales

- El tiempo objetivo de respuesta de la búsqueda debe mantenerse dentro del umbral definido para la operación normal.

- La información de disponibilidad debe provenir de datos sincronizados casi en tiempo real con los sistemas PMS integrados por la plataforma.

- El sistema debe mostrar los valores monetarios en la moneda seleccionada o en la moneda regional configurada para el usuario.

- El servicio debe soportar múltiples búsquedas simultáneas sin degradar significativamente la experiencia de uso.

### 3. ASR asociados

- ASR01 - Búsqueda rápida de hospedajes

- ASR02 - Consulta rápida de disponibilidad



## HU-W-19 - Creación de reservas

|Descripción|Como viajero que utiliza la plataforma TravelHub, quiero ver el detalle completo de una propiedad y poder iniciar la reserva desde esa misma vista, para evaluar rápidamente la opción y asegurar mi hospedaje antes de que se agote la disponibilidad.|
|---|---|



### 1. Requerimientos funcionales

- El sistema debe permitir ingresar al flujo de reserva desde la vista de detalle de una propiedad disponible.

- El detalle debe incluir como mínimo nombre de la propiedad, ubicación, galería de imágenes, descripción, tipo de habitación, precio por noche y disponibilidad para las fechas consultadas.

- Al iniciar el flujo de reserva, el sistema debe crear un carrito provisional asociado al usuario y a la habitación seleccionada.

- El sistema debe recalcular automáticamente el valor de la reserva cuando cambien fechas, número de huéspedes, cantidad de habitaciones o condiciones de tarifa.

- Antes de continuar, el sistema debe validar que la habitación siga disponible y que el usuario no supere la capacidad máxima permitida por la habitación seleccionada.

- El resumen de la reserva debe mostrar precio base, número de noches, descuentos aplicables, impuestos, cargos adicionales y total estimado.

- Si la propiedad o la habitación dejan de estar disponibles durante el proceso, el sistema debe informar la novedad y ofrecer opciones equivalentes cuando existan.

- El usuario debe poder continuar hacia el flujo de pago o regresar al detalle sin perder la información ya diligenciada en el carrito provisional.

### 2. Requerimientos no funcionales

- La carga de la vista de detalle debe mantenerse dentro del objetivo definido para la operación normal.

- La creación y confirmación de la reserva debe cumplir el objetivo de respuesta establecido para el servicio de reservas.

- El sistema debe impedir condiciones de overbooking mediante validaciones de disponibilidad y uso de hold temporal.

- Los cambios de la reserva provisional deben reflejarse de manera inmediata en la interfaz sin bloquear la interacción del usuario.

### 3. ASR asociados

- ASR03 - Carga rápida detalle de hotel

- ASR04 - Creación rápida de una reserva



## HU-M-26 - Búsqueda de hospedaje desde la app

|Descripción|Como viajero que utiliza la plataforma TravelHub desde la aplicación móvil, quiero buscar hospedaje utilizando filtros como fechas, número de habitaciones, ubicación y amenidades, para encontrar rápidamente opciones disponibles y asegurar mi hospedaje antes de que se agote la disponibilidad.|
|---|---|



### 1. Requerimientos funcionales

- La aplicación debe permitir realizar búsquedas por destino, fechas, huéspedes, habitaciones, precio y amenidades disponibles.

- Las fechas deben validarse con las mismas reglas del canal web: no se aceptan fechas pasadas y la salida debe ser posterior a la entrada.

- Los filtros deben poder editarse desde la misma pantalla de resultados sin perder el estado de navegación del usuario.

- Cada resultado debe mostrar nombre del hotel, ubicación, precio por noche, moneda, imagen principal y disponibilidad para las fechas consultadas.

- La app debe permitir ordenar resultados al menos por relevancia, precio o disponibilidad.

- Cuando no existan resultados, la aplicación debe mostrar un mensaje claro y permitir regresar al formulario de filtros para ajustar la búsqueda.

- Al seleccionar un resultado, la aplicación debe navegar al detalle de la propiedad con los datos de búsqueda previamente enviados.

### 2. Requerimientos no funcionales

- La búsqueda móvil debe cumplir el tiempo de respuesta esperado para el motor de búsqueda de TravelHub.

- La disponibilidad mostrada debe ser consistente con reservas confirmadas y holds activos.

- La aplicación debe mantener una experiencia fluida aun cuando múltiples usuarios consulten el mismo inventario.

### 3. ASR asociados

- ASR01 - Búsqueda rápida de hospedajes

- ASR02 - Consulta rápida de disponibilidad



## HU-W-13 - Cancelación de una reserva web

|Descripción|Como viajero, quiero cancelar una reserva desde la plataforma web, para no tener que contactar al soporte.|
|---|---|



### 1. Requerimientos funcionales

- El sistema debe permitir iniciar la cancelación únicamente sobre reservas que pertenezcan al usuario autenticado.

- Antes de ejecutar la cancelación, el sistema debe validar la política aplicable de la tarifa, del hotel y del país donde se realizó la reserva.

- El sistema debe mostrar al usuario el resultado esperado de la cancelación, incluyendo si existen penalidades, cargos o reembolsos parciales.

- El usuario debe confirmar explícitamente la acción antes de que la reserva cambie de estado.

- Una vez cancelada exitosamente, el sistema debe actualizar el estado de la reserva en el histórico y en el detalle correspondiente.

- Si la reserva no es cancelable, el sistema debe explicar claramente la causa y bloquear la operación.

- Después de la cancelación, el usuario debe recibir una notificación visual en la web y, cuando aplique, una notificación por correo con el resumen del resultado.

### 2. Requerimientos no funcionales

- La cancelación no debe generar inconsistencias entre el estado de la reserva y el inventario liberado.

- La operación debe registrarse de forma segura y trazable cuando involucre cambios de estado relevantes.

- Si el proceso depende de servicios externos de pago o reembolso, el usuario debe recibir un estado intermedio comprensible.

### 3. ASR asociados

- Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación.



## HU-W-18 - Visualización del detalle de la propiedad

|Descripción|Como viajero que busca hospedaje en TravelHub, quiero ver el detalle completo de una propiedad y poder iniciar el proceso de reserva desde esa vista, para evaluar rápidamente la opción y asegurar mi hospedaje antes de que se agote la disponibilidad.|
|---|---|



### 1. Requerimientos funcionales

- El sistema debe permitir ingresar al detalle de una propiedad desde el listado de resultados.

- El detalle debe mostrar nombre del hotel o propiedad, ubicación, imágenes, descripción del alojamiento, amenidades principales, precio por noche y disponibilidad para las fechas seleccionadas.

- El sistema debe presentar un resumen claro del total estimado de la reserva con su desglose antes de la confirmación.

- El usuario debe poder iniciar el proceso de reserva directamente desde esta vista.

- Si la información del hotel cambia mientras el usuario está navegando, el sistema debe mostrar la versión más actualizada del precio y la disponibilidad antes de permitir continuar.

- Cuando existan varias habitaciones o tarifas para el mismo hotel, el usuario debe poder identificar la opción concreta que está seleccionando.

### 2. Requerimientos no funcionales

- La vista de detalle debe cumplir el objetivo de carga definido para consulta detallada de propiedades.

- El inicio de la reserva desde el detalle debe activar un hold temporal consistente y seguro sobre el inventario.

- La experiencia de interacción no debe verse bloqueada por cálculos tarifarios o consultas de disponibilidad.

### 3. ASR asociados

- ASR03 - Carga rápida detalle de hotel

- ASR04 - Creación rápida de una reserva



## HU-W-32 - Login de usuario viajero

|Descripción|Como viajero que utiliza la plataforma TravelHub, quiero iniciar sesión en la plataforma utilizando mis credenciales, para acceder a mi cuenta y realizar acciones dentro del sistema como buscar habitaciones, gestionar reservas y consultar mi información.|
|---|---|



### 1. Requerimientos funcionales

- El formulario de acceso debe solicitar como mínimo correo electrónico y contraseña.

- El correo debe validarse con formato correcto antes de enviar la solicitud de autenticación.

- La contraseña no puede enviarse vacía y debe procesarse de forma segura por el servicio de autenticación.

- Si las credenciales son válidas, el sistema debe autenticar al usuario, crear su sesión y redirigirlo al flujo principal de la plataforma.

- Si las credenciales son inválidas, el sistema debe informar el error sin exponer cuál de los dos datos falló de manera insegura.

- Si la cuenta no existe, el sistema debe comunicarlo con un mensaje controlado y ofrecer opciones como registro o recuperación de acceso, si están habilitadas.

- El sistema debe permitir reintentar el inicio de sesión después de un intento fallido.

- La interfaz debe estar disponible al menos en español, inglés y portugués, y debe permitir cambio de idioma desde el propio flujo.

### 2. Requerimientos no funcionales

- Las credenciales deben viajar cifradas y no pueden almacenarse en texto plano.

- El sistema debe aplicar mecanismos de mitigación ante intentos reiterados de autenticación fallida, como límite de intentos, espera progresiva o verificación adicional.

- La autenticación debe protegerse contra ataques comunes sobre formularios y APIs expuestas a internet.

### 3. ASR asociados

- ASR16 - Protección contra ataques comunes



## HU-M-34 - Login de usuario viajero desde la app

|Descripción|Como viajero que utiliza la aplicación móvil de TravelHub, quiero iniciar sesión utilizando mis credenciales, para acceder a mi cuenta y realizar acciones dentro del sistema como buscar habitaciones, gestionar reservas y consultar mi información.|
|---|---|



### 1. Requerimientos funcionales

- La pantalla de login debe solicitar correo y contraseña y validar que ambos campos estén diligenciados.

- El correo debe verificarse en formato antes de consumir el servicio de autenticación.

- Si la autenticación es exitosa, la aplicación debe crear la sesión del usuario y redirigirlo a la pantalla principal correspondiente.

- Si el correo o la contraseña son incorrectos, la app debe mostrar un mensaje claro y permitir corregir los datos.

- Si la cuenta no existe, la app debe indicarlo y ofrecer la navegación al flujo de registro cuando este exista.

- El usuario debe poder reintentar el acceso sin necesidad de reiniciar la aplicación.

- El login móvil debe respetar la configuración idiomática de la app y permitir cambio entre español, inglés y portugués.

### 2. Requerimientos no funcionales

- Las credenciales deben transmitirse de forma segura y no deben persistirse en texto plano en el dispositivo.

- El servicio debe aplicar protección frente a ataques de fuerza bruta y otros ataques comunes.

- El manejo de sesión debe realizarse con tokens o mecanismos de autenticación seguros para entorno móvil.

### 3. ASR asociados

- ASR16 - Protección contra ataques comunes



## TFP-15.1 - HU-W-19 - Creación de reservas - Carrito de reserva con hold temporal

|Descripción|Como viajero que desea reservar una habitación en TravelHub, quiero poder agregar una habitación a un carrito de reserva con un hold temporal, para asegurar la disponibilidad de la habitación mientras finalizo el proceso de compra.|
|---|---|



### 1. Requerimientos funcionales

- El sistema debe permitir agregar una habitación disponible al carrito de reserva del usuario.

- Al agregar la habitación, el sistema debe crear un hold temporal de 15 minutos sobre esa habitación y sobre el rango de fechas seleccionado.

- El hold debe estar asociado al usuario que inició el proceso y no puede ser reutilizado por otro usuario.

- Mientras el hold esté activo, ningún otro usuario debe poder reservar la misma habitación para las mismas fechas.

- Si otro usuario intenta hacerlo, el sistema debe mostrar un mensaje claro indicando que la habitación ya no está disponible.

- Si el usuario confirma antes de la expiración, el hold debe convertirse en una reserva confirmada.

- Si el usuario no finaliza a tiempo, el sistema debe liberar automáticamente la habitación al inventario.

- Antes de confirmar, el sistema debe revalidar la disponibilidad para garantizar consistencia final de la transacción.

- El carrito debe conservar la información seleccionada mientras el hold permanezca vigente.

- El sistema debe garantizar unicidad del hold activo por habitación y rango de fechas aun con solicitudes concurrentes.

### 2. Requerimientos no funcionales

- El proceso de creación del hold debe cumplir el objetivo de respuesta establecido para creación de reserva.

- El mecanismo de hold debe impedir overbooking y soportar concurrencia sobre el mismo inventario.

- Cuando el hold expire, la liberación del inventario debe ser automática y consistente.

### 3. ASR asociados

- ASR04 - Creación rápida de una reserva



## TFP-15.2 - HU-W-19 - Creación de reservas - Confirmación visual y por correo electrónico

|Descripción|Como viajero que realiza una reserva en TravelHub, quiero recibir una confirmación visual inmediata en la plataforma y una confirmación por correo electrónico, para tener seguridad de que mi reserva fue realizada correctamente y poder consultar los detalles posteriormente.|
|---|---|



### 1. Requerimientos funcionales

- Al completarse exitosamente la reserva, la interfaz debe mostrar una confirmación visual inmediata al usuario.

- El mensaje o modal de confirmación debe incluir como mínimo nombre del hotel, fechas de la reserva, número de huéspedes y número de confirmación.

- El componente de confirmación debe incluir un acceso al detalle completo de la reserva o a la sección de Mis reservas.

- El sistema debe enviar automáticamente un correo de confirmación al usuario cuando la reserva se cree correctamente.

- El correo debe incluir datos relevantes de la reserva, tales como hotel, fechas, huéspedes, total pagado o total reservado y número de confirmación.

- Si el envío de correo falla, la reserva no debe perderse; el sistema debe permitir reprocesar el envío o dejar trazabilidad para reintento.

### 2. Requerimientos no funcionales

- La confirmación visual debe generarse inmediatamente después de la respuesta exitosa del servicio de reservas.

- La notificación por correo debe ejecutarse sin bloquear la experiencia de usuario.

- La información presentada en pantalla y en correo debe ser consistente con la reserva persistida.

### 3. ASR asociados

- ASR04 - Creación rápida de una reserva



# SPRINT 2

Cobertura del sprint. Este sprint contiene 8 historias de usuario refinadas y detalladas.



## HU-W-20 - Integración con proveedor de pago - backend

|Descripción|Como viajero, quiero realizar el pago de mi reserva de forma segura e integrada a través de proveedores externos, para confirmar mi transacción de manera inmediata y sin riesgos de exposición de mis datos financieros.|
|---|---|



### 1. Requerimientos funcionales

- El servicio de pagos debe operar como componente independiente del resto del sistema de reservas.

- El backend debe comunicarse con el proveedor de pago mediante contratos claros y desacoplados, preferiblemente a través de eventos o flujos asíncronos cuando corresponda.

- El sistema no debe almacenar datos crudos de tarjeta; la información sensible debe tokenizarse o enviarse directamente al proveedor autorizado.

- El backend debe crear y rastrear una intención de pago vinculada a la reserva correspondiente.

- El sistema debe registrar el estado del pago al menos en categorías como pendiente, aprobado, rechazado o en conciliación.

- El procesamiento debe contemplar idempotencia para evitar cobros duplicados ante reintentos, webhooks repetidos o confirmaciones múltiples del proveedor.

- El servicio debe incorporar reglas de detección de fraude para transacciones duplicadas, patrones anómalos o velocidades sospechosas.

- Cuando el proveedor notifique el resultado final, el backend debe actualizar el estado de la reserva y disparar las notificaciones necesarias al usuario.

- El diseño debe permitir agregar nuevos proveedores de pago sin modificar múltiples componentes del sistema.

### 2. Requerimientos no funcionales

- El procesamiento del pago debe cumplir el objetivo de desempeño definido para pagos.

- La solución debe cumplir con PCI-DSS 3.2.1, tokenización y cifrado TLS 1.2 o superior.

- Las alertas por fraude o anomalías de pago deben generarse con rapidez suficiente para su atención oportuna.

- La mantenibilidad del adaptador de pagos debe facilitar la incorporación de un nuevo proveedor con impacto acotado.

### 3. ASR asociados

- ASR05 - Procesamiento agil de pagos

- ASR15 - Cumplimiento PCI-DSS en pagos

- ASR20 - Modificabilidad Nuevo Proveedor



## HU-W-20.2 / TFP-131 - Integración con proveedor de pagos - Front TravelHub

|Descripción|Como usuario que está realizando una reserva, quiero ser redirigido e interactuar con el front del proveedor de pagos, para completar el pago de manera segura y confirmar mi reserva.|
|---|---|



### 1. Requerimientos funcionales

- Al confirmar la intención de pago, el sistema debe redirigir al usuario al front del proveedor correspondiente o cargar el componente seguro definido por dicho proveedor.

- El front del proveedor debe mostrar el valor total de la reserva a pagar y la referencia asociada a la transacción.

- El usuario debe poder ingresar los datos de pago exigidos por el proveedor para tarjetas o métodos soportados.

- El sistema debe mostrar una confirmación clara cuando la transacción sea aprobada.

- El sistema debe mostrar un mensaje de error entendible cuando la transacción sea rechazada o no pueda procesarse.

- Al finalizar el pago, el usuario debe ser retornado a TravelHub con el estado actualizado de su reserva o de su intento de pago.

- Si el pago falla, la reserva no debe confirmarse; el sistema debe dejarla en estado pendiente o liberar el inventario según la regla de negocio aplicable.

- El flujo debe contemplar reintento del pago sin generar dobles cobros.

### 2. Requerimientos no funcionales

- La experiencia del usuario durante el pago no debe exponer datos sensibles a TravelHub fuera del flujo permitido por el proveedor.

- El resultado del pago debe reflejarse oportunamente en el sistema de reservas.

- El canal debe operar bajo transporte seguro y con controles de idempotencia.

### 3. ASR asociados

- ASR05 - Procesamiento agil de pagos

- ASR15 - Cumplimiento PCI-DSS en pagos



## HU-M-28 - Detalle y creación de reserva app móvil

|Descripción|Como viajero usando la aplicación móvil, quiero ver el detalle completo de una propiedad y proceder a reservarla inmediatamente, para asegurar mi hospedaje de manera rápida antes de que se agote la disponibilidad.|
|---|---|



### 1. Requerimientos funcionales

- La app debe mostrar en el detalle de la propiedad imágenes, descripción, amenidades, ubicación, tarifas y disponibilidad actualizada.

- El detalle debe cargar con la información necesaria para que el usuario pueda decidir sin navegar a múltiples pantallas.

- Al iniciar la reserva, la aplicación debe activar un carrito provisional con hold de 15 minutos sobre la habitación seleccionada.

- La pantalla de confirmación debe mostrar un contador regresivo visible con el tiempo restante del hold.

- Si la habitación ya fue tomada por otro usuario, la app debe informar el conflicto y proponer alternativas disponibles del mismo hotel cuando existan.

- Los cambios en el carrito y en el formulario deben guardarse localmente de inmediato y sincronizarse en segundo plano cuando sea posible.

- El flujo debe calcular automáticamente precio base, noches, impuestos, descuentos y total final antes de la confirmación.

- Si el pago falla, la app debe mantener el hold mientras siga vigente, mostrar el error y permitir reintento.

- Si durante el pago se pierde conectividad, la app debe guardar el estado, consultar la transacción al recuperar conexión y evitar cobros duplicados.

### 2. Requerimientos no funcionales

- La carga del detalle debe cumplir el objetivo de detalle de hotel y la confirmación el objetivo de creación de reserva.

- El manejo de pagos debe alinearse con el ASR de procesamiento ágil y sin duplicidad.

- La experiencia móvil debe evitar bloqueos de interfaz mediante persistencia optimista y sincronización en segundo plano.

### 3. ASR asociados

- ASR03 - Carga rápida detalle de hotel

- ASR04 - Creación rápida de una reserva

- ASR05 - Procesamiento agil de pagos



## HU-M-27 - Visualización y gestión de reservas

|Descripción|Como viajero frecuente, quiero acceder a mi lista de reservas actuales y pasadas en la aplicación móvil, para consultar mi itinerario o realizar el check-in sin necesidad de conexión a internet constante.|
|---|---|



### 1. Requerimientos funcionales

- La app debe mostrar reservas activas y pasadas del usuario autenticado.

- El listado debe soportar visualización del detalle de cada reserva con información básica del hotel y del itinerario.

- En modo offline, la aplicación debe permitir consultar la última versión sincronizada de las reservas confirmadas almacenadas localmente.

- El usuario debe visualizar un indicador persistente cuando la aplicación opere sin conectividad.

- Al recuperar conexión, la app debe sincronizar automáticamente la caché local sin bloquear la interfaz y mostrar la fecha y hora de la última sincronización.

- Si el hotel y la política lo permiten, el usuario debe poder iniciar cancelación de la reserva desde este flujo.

- La aplicación debe enviar recordatorios de check-in y confirmaciones de cancelación por push y, cuando aplique, por correo electrónico.

- Si durante la sincronización se detecta que una reserva cambió por otro canal, la aplicación debe actualizar su estado local e informar al usuario.

### 2. Requerimientos no funcionales

- La carga del histórico de reservas debe cumplir el objetivo oficial de histórico.

- La sincronización posterior a reconexión debe ejecutarse en segundo plano y sin bloquear la experiencia.

- El almacenamiento local debe proteger la consistencia del historial mostrado al usuario.

### 3. ASR asociados

- ASR06 - Carga rapida del histórico de reservas



## HU-W-11 - Consulta de Mis Reservas web

|Descripción|Como viajero, quiero consultar mis reservas actuales y pasadas en la web, para gestionar mis viajes fácilmente.|
|---|---|



### 1. Requerimientos funcionales

- El sistema debe listar reservas activas, canceladas, completadas o históricas pertenecientes al usuario autenticado.

- El usuario debe poder filtrar el historial por rango de fechas, estado y nombre del hotel.

- Cada registro debe permitir navegar al detalle completo de la reserva correspondiente.

- Cuando el historial sea extenso, el sistema debe paginar los resultados para mantener un desempeño adecuado.

- El sistema debe mantener consistencia entre el estado del histórico y el estado real de la reserva.

### 2. Requerimientos no funcionales

- La carga del histórico debe cumplir el tiempo objetivo definido para consulta de reservas.

- La navegación al detalle desde el histórico no debe generar bloqueos o inconsistencias.

- La paginación debe implementarse de forma eficiente para no degradar la base de datos ni la experiencia del usuario.

### 3. ASR asociados

- ASR06 - Carga rapida del histórico de reservas



## HU-P-21 - Login y autenticación de administrador

|Descripción|Como administrador del sistema o gerente de hotel, quiero autenticarme de forma segura en el portal administrativo, para gestionar configuraciones y datos sensibles sin riesgo de accesos no autorizados.|
|---|---|



### 1. Requerimientos funcionales

- El sistema debe exigir autenticación mediante usuario y contraseña para usuarios del portal administrativo.

- El acceso debe requerir autenticación multifactor para todos los perfiles administrativos o con acceso a datos sensibles.

- El login debe validar además el rol del usuario y restringir el acceso a la región o al hotel autorizado según la política RBAC.

- Si el segundo factor no se completa o es inválido, el acceso debe bloquearse.

- El sistema debe detectar patrones anómalos de acceso, como ubicaciones imposibles respecto al último inicio de sesión conocido, y generar una alerta.

- Las credenciales deben procesarse sin almacenamiento inseguro y bajo mecanismos de transmisión cifrada.

### 2. Requerimientos no funcionales

- El acceso administrativo debe cumplir las exigencias de MFA definidas en el backlog de arquitectura.

- La autenticación debe protegerse contra ataques comunes y contra intentos anómalos de acceso.

- Los datos de autenticación y sus evidencias de acceso deben tratarse bajo controles de seguridad reforzados.

### 3. ASR asociados

- ASR16 - Protección contra ataques comunes

- ASR23 - Autenticación multifactor (MFA) para accesos



## HU-P-25 - Gestión de tarifa

|Descripción|Como administrador de un hotel en el portal de administración, quiero crear, editar y administrar las tarifas de mis habitaciones, para ajustar precios según temporada, demanda y estrategias comerciales sin depender del soporte de TravelHub.|
|---|---|



### 1. Requerimientos funcionales

- Solo usuarios con rol Administrador de Hotel deben poder acceder a esta funcionalidad.

- El sistema debe listar tarifas existentes por tipo de habitación, rango de fechas y moneda.

- El administrador debe poder crear una nueva tarifa indicando al menos tipo de habitación, precio base, moneda, rango de vigencia y reglas de cancelación asociadas cuando apliquen.

- El administrador debe poder editar una tarifa vigente o futura, respetando reglas de integridad para evitar solapamientos inválidos.

- El sistema debe validar que el precio sea un valor numérico positivo y que el rango de fechas sea consistente.

- Las operaciones de creación, edición o desactivación deben dejar trazabilidad suficiente para auditoría.

- Los cambios realizados deben impactar la lógica tarifaria aplicable a futuras búsquedas y reservas según la fecha de vigencia.

### 2. Requerimientos no funcionales

- Los cambios sobre tarifas deben registrar trazabilidad y no comprometer la consistencia de precios mostrados a los usuarios.

- Las operaciones sobre información sensible del negocio deben ser auditables.

- Cuando existan integraciones dependientes, los cambios deben propagarse sin corrupción de datos ni indisponibilidad del servicio.

### 3. ASR asociados

- ASR18 - Auditoría de cambios



## HU-P-22 - Dashboard de Reservas

|Descripción|Como administrador de un hotel en el portal de administración, quiero visualizar un dashboard con el estado y resumen de mis reservas, para monitorear la operación diaria del hotel y tomar decisiones oportunas sobre disponibilidad y servicio.|
|---|---|



### 1. Requerimientos funcionales

- Solo usuarios con rol Administrador de Hotel deben poder acceder al dashboard.

- El dashboard debe mostrar indicadores clave como reservas activas, pendientes, confirmadas, canceladas y rechazadas.

- El sistema debe presentar ocupación estimada por día o por rango de fechas.

- El administrador debe poder filtrar la información por rango de fechas, estado de reserva, tipo de habitación y código de reserva.

- El listado asociado debe permitir navegar hacia el detalle de una reserva específica cuando sea requerido.

- Los datos del dashboard deben corresponder al hotel o conjunto de hoteles autorizados para ese administrador.

### 2. Requerimientos no funcionales

- Los datos del dashboard deben reflejar información consistente y actualizada del dominio de reservas.

- La consulta no debe exponer reservas de hoteles o regiones no autorizadas para el usuario administrativo.

- Cuando el volumen de datos crezca, el dashboard debe mantenerse utilizable mediante filtros y consultas eficientes.

### 3. ASR asociados

- Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación.



# SPRINT 3

Cobertura del sprint. Este sprint contiene 10 historias de usuario refinadas y detalladas.



## HU-W-31 - Registro de usuario viajero

|Descripción|Como usuario nuevo del sistema TravelHub, quiero registrar mi perfil dentro de la plataforma, para poder acceder a sus funcionalidades y realizar búsquedas y reservas de hoteles.|
|---|---|



### 1. Requerimientos funcionales

- El sistema debe permitir el registro con correo electrónico, contraseña y datos personales mínimos requeridos por el negocio.

- Antes de crear la cuenta, el sistema debe validar formato de correo, fortaleza mínima de contraseña y obligatoriedad de campos requeridos.

- Al completar el formulario, el sistema debe crear una cuenta en estado pendiente de verificación.

- El sistema debe enviar al correo del usuario una notificación con el mecanismo de verificación correspondiente.

- El usuario debe poder completar la verificación y activar la cuenta para iniciar sesión.

- Si el correo ya está asociado a una cuenta existente, el sistema debe impedir el registro duplicado y mostrar un mensaje claro.

- El sistema debe evitar la creación de múltiples cuentas activas para el mismo correo electrónico.

### 2. Requerimientos no funcionales

- El flujo de registro debe completar la creación de cuenta sin bloquear la interfaz del usuario.

- Los datos personales deben almacenarse y tratarse conforme a políticas de protección de datos.

- La información persistida debe quedar protegida bajo controles de seguridad acordes con la plataforma.

- El procesamiento de registro debe tener un tiempo razonable de ejecución en operación normal.

### 3. ASR asociados

- ASR17 - Cumplimiento GDPR/LGPD

- ASR22 - Encriptación de datos en reposo (AES-256)



## HU-M-33 - Registro de usuario viajero desde la app

|Descripción|Como usuario nuevo del sistema TravelHub, quiero poder realizar el registro de mi perfil dentro de la plataforma desde la aplicación móvil, para poder hacer uso de la misma mediante la búsqueda y reserva en hoteles.|
|---|---|



### 1. Requerimientos funcionales

- La aplicación debe permitir capturar los datos mínimos requeridos para el registro del viajero.

- El correo electrónico debe validarse en formato antes de enviar la solicitud al backend.

- Al finalizar el registro, el sistema debe enviar una notificación al correo electrónico del usuario para completar la activación de la cuenta.

- La app debe informar claramente al usuario que la cuenta queda pendiente de verificación hasta completar el proceso recibido por correo.

- Si el correo ya existe, la app debe impedir el registro y presentar el mensaje correspondiente.

### 2. Requerimientos no funcionales

- Los datos personales del usuario deben tratarse conforme a protección de datos personales.

- Las credenciales y datos persistidos deben quedar protegidos en reposo y en tránsito.

- El flujo móvil debe ser claro y no bloquear la interacción mientras se genera la solicitud de registro.

### 3. ASR asociados

- ASR17 - Cumplimiento GDPR/LGPD

- ASR22 - Encriptación de datos en reposo (AES-256)



## HU-P-23 - Detalle de reserva con opción de confirmar/rechazar

|Descripción|Como administrador de un hotel en el portal de administración, quiero visualizar el detalle completo de una reserva y poder confirmarla o rechazarla, para gestionar adecuadamente la disponibilidad del hotel y asegurar el cumplimiento de mis políticas operativas.|
|---|---|



### 1. Requerimientos funcionales

- Solo usuarios autorizados del hotel correspondiente deben poder acceder a la gestión de la reserva.

- El detalle debe mostrar código de reserva, estado actual, fechas, habitación, número de huéspedes, tarifa aplicada, impuestos y datos básicos del cliente sin exponer información sensible.

- Las opciones Confirmar y Rechazar solo deben estar visibles cuando la reserva esté en estado pendiente.

- Al confirmar o rechazar, el sistema debe solicitar validación explícita de la acción para evitar cambios accidentales.

- El cambio de estado debe actualizarse inmediatamente y reflejarse en los demás módulos dependientes del negocio.

- Si la reserva ya fue modificada por otro canal, el sistema debe bloquear acciones obsoletas y mostrar el estado actualizado.

### 2. Requerimientos no funcionales

- Todo cambio de estado relevante debe quedar auditado con información suficiente para trazabilidad.

- Los datos sensibles del cliente no deben exponerse más allá de lo estrictamente necesario.

- La operación debe ejecutarse sin inconsistencias entre reserva, inventario y notificaciones derivadas.

### 3. ASR asociados

- ASR18 - Auditoría de cambios



## HU-P-24 - Reporte de ingresos por mes gráfico y tabla

|Descripción|Como administrador de un hotel en el portal de administración, quiero visualizar un reporte mensual de ingresos en formato gráfico y tabular, para analizar el desempeño financiero del hotel y tomar decisiones informadas.|
|---|---|



### 1. Requerimientos funcionales

- Solo administradores autorizados del hotel deben poder acceder al reporte.

- El usuario debe poder seleccionar mes y año a consultar; por defecto debe mostrarse el período actual.

- El sistema debe presentar una vista gráfica de ingresos diarios del mes con ejes y etiquetas claras.

- El sistema debe presentar una tabla de detalle con fecha, número de reservas, ingresos brutos, comisiones de TravelHub e ingresos netos del hotel.

- El reporte debe filtrar exclusivamente la información del hotel o alcance autorizado para el usuario actual.

- Los valores mostrados deben corresponder a información conciliada o al menos consistente con la operación de reservas.

### 2. Requerimientos no funcionales

- El reporte debe preservar la confidencialidad de la información financiera del hotel.

- La tabla y la vista gráfica deben ser consistentes entre sí para el mismo período consultado.

- La consulta debe ejecutarse de manera eficiente para no afectar la usabilidad del portal administrativo.

### 3. ASR asociados

- Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación.



## HU-M-29 - Notificaciones push app móvil

|Descripción|Como viajero, quiero recibir notificaciones sobre mi reserva, para estar informado de confirmaciones o cambios.|
|---|---|



### 1. Requerimientos funcionales

- El sistema debe enviar una notificación push cuando se cree exitosamente una reserva.

- El sistema debe enviar notificaciones push cuando cambie el estado de una reserva, por ejemplo pendiente, confirmada, cancelada o con novedad de pago.

- Las notificaciones deben identificar claramente la reserva afectada y el tipo de evento ocurrido.

- El usuario debe poder abrir la notificación y navegar a la pantalla o detalle relacionado dentro de la app cuando sea posible.

### 2. Requerimientos no funcionales

- Las notificaciones no deben contradecir el estado real de la reserva registrado en backend.

- El mecanismo de notificación debe operar sin bloquear los procesos principales de reserva o pago.

- La información enviada debe limitarse a lo necesario, evitando exposición innecesaria de datos sensibles.

### 3. ASR asociados

- Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación.



## HU-M-30 - Check-in mediante código QR

|Descripción|Como viajero con una reserva confirmada, quiero realizar el check-in del hotel escaneando un código QR desde la app móvil, para agilizar mi ingreso al hotel sin filas ni intervención manual del personal.|
|---|---|



### 1. Requerimientos funcionales

- El check-in con QR solo debe habilitarse cuando la reserva esté confirmada y dentro de la ventana permitida por las reglas del hotel.

- En la sección Mis reservas, la app debe mostrar el botón o acción de Check-in con QR cuando aplique.

- La aplicación debe permitir abrir la cámara del dispositivo para leer correctamente el código QR en condiciones normales.

- Si el QR es válido, el sistema debe marcar el check-in o registrar el evento correspondiente según el flujo del hotel.

- Si el QR es inválido, expiró o no corresponde a la reserva, la app debe informar el error y evitar una actualización incorrecta del estado.

### 2. Requerimientos no funcionales

- La funcionalidad debe ser usable y suficientemente rápida para no afectar la experiencia de llegada al hotel.

- El proceso debe respetar las reglas de negocio del hotel y la vigencia de la reserva.

- Los eventos de check-in deben quedar registrados de forma consistente con el estado de la reserva.

### 3. ASR asociados

- Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación.



## HU-W-15 - Notificaciones de estado web

|Descripción|Como usuario de la plataforma web, quiero recibir notificaciones inmediatas sobre cambios en mis transacciones, para tener certeza sobre el éxito de mis reservas o problemas con mis pagos.|
|---|---|



### 1. Requerimientos funcionales

- El sistema debe enviar un correo de confirmación con el resumen de la reserva cuando una transacción se complete exitosamente.

- El front web debe mostrar alertas visuales inmediatas, como toasts o banners, cuando el estado de una reserva cambie.

- Si el pago asíncrono falla, el usuario debe recibir una notificación con instrucciones claras para reintentar o cambiar el método de pago.

- Las notificaciones deben estar vinculadas a la reserva o transacción correcta y no deben duplicarse innecesariamente.

### 2. Requerimientos no funcionales

- Las notificaciones deben reflejar el estado final y consistente de la operación de reserva o pago.

- El envío de notificaciones no debe bloquear el proceso principal del usuario.

- El cambio de estado debe propagarse con suficiente rapidez para mantener una experiencia confiable.

### 3. ASR asociados

- ASR05 - Procesamiento agil de pagos



## HU-M-12 - Consulta de Mis Reservas móvil

|Descripción|Como viajero, quiero consultar mis reservas actuales y pasadas desde la aplicación móvil, para gestionar mis viajes fácilmente.|
|---|---|



### 1. Requerimientos funcionales

- La app debe mostrar reservas activas y finalizadas del usuario autenticado.

- El listado debe permitir abrir el detalle de cada reserva.

- La información mostrada debe ser consistente con el estado real de las reservas en backend.

- Si existe historial amplio, la app debe presentar la información de forma ordenada y navegable.

### 2. Requerimientos no funcionales

- La consulta debe cumplir el tiempo objetivo oficial para histórico de reservas.

- La experiencia de navegación no debe bloquearse mientras se carga la información del usuario.

- El historial debe mantenerse consistente incluso cuando existan actualizaciones provenientes de otros canales.

### 3. ASR asociados

- ASR06 - Carga rapida del histórico de reservas



## HU-M-14 - Cancelación de una reserva móvil

|Descripción|Como viajero, quiero cancelar una reserva desde la aplicación móvil, para no tener que contactar al soporte.|
|---|---|



### 1. Requerimientos funcionales

- La app debe permitir cancelar únicamente reservas del usuario autenticado que cumplan la política de cancelación vigente.

- Antes de cancelar, debe mostrarse la política aplicable y los efectos esperados sobre cargos o reembolsos.

- El usuario debe confirmar la acción antes de que el estado se actualice.

- Una vez ejecutada la cancelación, el sistema debe reflejar el nuevo estado en la app y notificar el resultado al usuario.

- Si la reserva no puede cancelarse, la aplicación debe explicar la causa de manera clara.

### 2. Requerimientos no funcionales

- La operación no debe generar inconsistencias entre reserva, inventario y eventuales procesos de reembolso.

- Si la cancelación modifica información sensible del negocio, debe existir trazabilidad suficiente en backend.

- La experiencia del usuario debe ser clara incluso cuando la operación dependa de procesos asíncronos.

### 3. ASR asociados

- Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación.



## HU-W-34 - Calificar hotel

|Descripción|Como usuario, quiero calificar mi experiencia y agregar una opinión, para compartir esta información con los demás viajeros.|
|---|---|



### 1. Requerimientos funcionales

- El sistema debe permitir registrar una calificación del hotel en una escala de 1 a 5.

- El sistema debe permitir asociar una opinión o comentario textual a la calificación cuando el negocio lo permita.

- El sistema debe mostrar la información de la calificación del hotel dentro de la experiencia de consulta o detalle.

- El sistema debe validar que el rango de la calificación esté entre 1 y 5 y evitar valores fuera del rango esperado.

- Solo se debe permitir calificar de acuerdo con la regla de negocio definida, por ejemplo usuarios con reserva o estadía completada, si esa restricción es implementada.

### 2. Requerimientos no funcionales

- La información publicada debe ser consistente con el hotel calificado.

- El sistema debe impedir errores de captura que generen puntuaciones inválidas.

- Las reseñas y calificaciones deben almacenarse de manera segura y con trazabilidad suficiente para moderación si se implementa.

### 3. ASR asociados

- Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación.


## Matriz final de Sprint, HU y ASR asociados

| Sprint | HU | ASR asociados |
|---|---|---|
| Sprint 1 | HU-W-17 - Búsqueda avanzada de hospedaje | ASR01 - Búsqueda rápida de hospedajes; ASR02 - Consulta rápida de disponibilidad |
| Sprint 1 | HU-W-19 - Creación de reservas | ASR03 - Carga rápida detalle de hotel; ASR04 - Creación rápida de una reserva |
| Sprint 1 | HU-M-26 - Búsqueda de hospedaje desde la app | ASR01 - Búsqueda rápida de hospedajes; ASR02 - Consulta rápida de disponibilidad |
| Sprint 1 | HU-W-13 - Cancelación de una reserva web | Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación |
| Sprint 1 | HU-W-18 - Visualización del detalle de la propiedad | ASR03 - Carga rápida detalle de hotel; ASR04 - Creación rápida de una reserva |
| Sprint 1 | HU-W-32 - Login de usuario viajero | ASR16 - Protección contra ataques comunes |
| Sprint 1 | HU-M-34 - Login de usuario viajero desde la app | ASR16 - Protección contra ataques comunes |
| Sprint 1 | TFP-15.1 - HU-W-19 - Creación de reservas - Carrito de reserva con hold temporal | ASR04 - Creación rápida de una reserva |
| Sprint 1 | TFP-15.2 - HU-W-19 - Creación de reservas - Confirmación visual y por correo electrónico | ASR04 - Creación rápida de una reserva |
| Sprint 2 | HU-W-20 - Integración con proveedor de pago - backend | ASR05 - Procesamiento agil de pagos; ASR15 - Cumplimiento PCI-DSS en pagos; ASR20 - Modificabilidad Nuevo Proveedor |
| Sprint 2 | HU-W-20.2 / TFP-131 - Integración con proveedor de pagos - Front TravelHub | ASR05 - Procesamiento agil de pagos; ASR15 - Cumplimiento PCI-DSS en pagos |
| Sprint 2 | HU-M-28 - Detalle y creación de reserva app móvil | ASR03 - Carga rápida detalle de hotel; ASR04 - Creación rápida de una reserva |
| Sprint 2 | HU-M-27 - Visualización y gestión de reservas | ASR06 - Carga rapida del histórico de reservas |
| Sprint 2 | HU-W-11 - Consulta de Mis Reservas web | ASR06 - Carga rapida del histórico de reservas |
| Sprint 2 | HU-P-21 - Login y autenticación de administrador | ASR16 - Protección contra ataques comunes; ASR23 - Autenticación multifactor (MFA) para accesos |
| Sprint 2 | HU-P-25 - Gestión de tarifa | ASR18 - Auditoría de cambios |
| Sprint 2 | HU-P-22 - Dashboard de Reservas | Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación |
| Sprint 3 | HU-W-31 - Registro de usuario viajero | ASR17 - Cumplimiento GDPR/LGPD |
| Sprint 3 | HU-M-33 - Registro de usuario viajero desde la app | ASR17 - Cumplimiento GDPR/LGPD |
| Sprint 3 | HU-P-23 - Detalle de reserva con opción de confirmar/rechazar | ASR18 - Auditoría de cambios |
| Sprint 3 | HU-P-24 - Reporte de ingresos por mes gráfico y tabla | Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación |
| Sprint 3 | HU-M-29 - Notificaciones push app móvil | Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación |
| Sprint 3 | HU-M-30 - Check-in mediante código QR | Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación |
| Sprint 3 | HU-W-15 - Notificaciones de estado web | ASR05 - Procesamiento agil de pagos |
| Sprint 3 | HU-M-12 - Consulta de Mis Reservas móvil | ASR06 - Carga rapida del histórico de reservas |
| Sprint 3 | HU-M-14 - Cancelación de una reserva móvil | Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación |
| Sprint 3 | HU-W-34 - Calificar hotel | Sin ASR directo específico en el backlog; aplican ASR globales de plataforma según implementación |

## Resumen rápido de ASR a validar por sprint

| Sprint | ASR a validar |
|---|---|
| Sprint 1 | ASR01, ASR02, ASR03, ASR04, ASR16 |
| Sprint 2 | ASR03, ASR04, ASR05, ASR06, ASR15, ASR16, ASR18, ASR20, ASR23 |
| Sprint 3 | ASR05, ASR06, ASR17, ASR18 |