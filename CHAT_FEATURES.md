# Ready Party - Chat y Solicitud de Cancelación

## Resumen de Cambios Implementados

### 1. **Botones de Acción en "Mi Fiesta"**
Cuando un usuario tiene una reserva confirmada, ahora verá dos botones debajo del resumen de la reserva:

- **"Solicitud de cancelación"** (botón rojo)
  - Envía una notificación al local solicitando la cancelación
  - Incluye todos los datos de la reserva (fecha, hora, nombre del usuario)
  
- **"Chat con local"** (botón azul)
  - Abre una ventana de chat en tiempo real con el local
  - Permite comunicación directa entre el usuario y el negocio

### 2. **Sistema de Notificaciones para Locales**
Los locales ahora reciben notificaciones en la sección "Notificaciones" que incluyen:

#### Tipos de Notificaciones:
1. **Solicitud de Cancelación** (🚫)
   - Muestra el nombre del usuario
   - Fecha y hora de la reserva
   - Mensaje de solicitud
   - Botón para borrar la notificación

2. **Solicitud de Chat** (💬)
   - Muestra el nombre del usuario que quiere chatear
   - Botón "Abrir Chat" para iniciar la conversación
   - Botón para borrar la notificación

#### Características:
- Badge de notificación en el icono de campana (muestra el número de notificaciones no leídas)
- Actualización automática cada 30 segundos
- Animación de pulso en el badge
- Posibilidad de eliminar notificaciones individuales

### 3. **Sistema de Chat en Tiempo Real**

#### Para Usuarios (Familias):
- Botón "Chat con local" en la vista de reserva confirmada
- Modal de chat con diseño moderno
- Mensajes en tiempo real
- Mensajes propios alineados a la derecha (fondo degradado rosa/naranja)
- Mensajes recibidos alineados a la izquierda (fondo blanco)

#### Para Locales:
- Reciben notificación cuando un usuario solicita chat
- Pueden abrir el chat desde la notificación
- Mismo sistema de mensajería en tiempo real
- Interfaz consistente con el diseño de la aplicación

#### Características del Chat:
- **Tiempo real**: Los mensajes aparecen instantáneamente usando Firestore listeners
- **Persistencia**: Los mensajes se guardan en la base de datos
- **Timestamps**: Cada mensaje muestra la hora de envío
- **Scroll automático**: Se desplaza automáticamente al último mensaje
- **Diseño responsive**: Se adapta a diferentes tamaños de pantalla
- **Animaciones suaves**: Entrada de mensajes con efecto de deslizamiento

### 4. **Estructura de Base de Datos**

#### Colección `notifications`:
```javascript
{
  type: 'cancellation_request' | 'chat_request',
  venueId: string,           // ID del local
  userId: string,            // ID del usuario
  userName: string,          // Nombre del usuario
  venueName: string,         // Nombre del local
  message: string,           // Mensaje de la notificación
  reservationDate: string,   // (solo para cancelación)
  reservationTime: string,   // (solo para cancelación)
  chatId: string,            // (solo para chat)
  timestamp: Timestamp,
  read: boolean
}
```

#### Colección `chats`:
```javascript
{
  participants: [userId, venueId],
  familyId: string,
  venueId: string,
  venueName: string,
  lastMessage: string,
  lastMessageTime: Timestamp
}
```

#### Subcolección `chats/{chatId}/messages`:
```javascript
{
  senderId: string,
  text: string,
  timestamp: Timestamp
}
```

### 5. **Estilos CSS Añadidos**

- **Modal de Chat**: Fondo semitransparente con blur, animación de entrada
- **Mensajes**: Burbujas de chat con diferentes estilos para enviados/recibidos
- **Notificaciones**: Cards con borde de color según el tipo
- **Badge de notificación**: Círculo rojo con animación de pulso
- **Botones de acción**: Estilos consistentes con el diseño de la app

### 6. **Funciones JavaScript Principales**

#### Para Usuarios:
- `requestCancellation(venueId, date, time, venueName)`: Envía solicitud de cancelación
- `openChat(venueId, venueName)`: Abre el chat con el local
- `sendChatMessage()`: Envía un mensaje en el chat
- `closeChat()`: Cierra el modal de chat

#### Para Locales:
- `loadBusinessNotifications()`: Carga las notificaciones del local
- `deleteNotification(notifId)`: Elimina una notificación
- `openBusinessChat(chatId, userName)`: Abre el chat desde una notificación
- `updateNotificationBadge()`: Actualiza el contador de notificaciones

#### Funciones Auxiliares:
- `getChatId(userId1, userId2)`: Genera ID único para el chat
- `loadChatMessages()`: Carga mensajes con listener en tiempo real
- `renderChatMessage(msg)`: Renderiza un mensaje en el chat
- `renderNotification(notifId, notif, container)`: Renderiza una notificación

## Flujo de Uso

### Solicitud de Cancelación:
1. Usuario con reserva confirmada ve el botón "Solicitud de cancelación"
2. Al hacer clic, confirma la acción
3. Se crea una notificación en Firestore
4. El local ve la notificación en su panel
5. El local puede cancelar manualmente la reserva desde "Reservas"

### Chat:
1. Usuario hace clic en "Chat con local"
2. Se abre el modal de chat
3. Si es la primera vez, se crea notificación para el local
4. El local recibe notificación de solicitud de chat
5. El local hace clic en "Abrir Chat" desde la notificación
6. Ambos pueden enviar mensajes en tiempo real
7. Los mensajes se sincronizan automáticamente

## Notas Técnicas

- **Seguridad**: Las reglas de Firestore deben configurarse para permitir:
  - Usuarios: leer/escribir sus propios chats
  - Locales: leer/escribir chats donde sean participantes
  - Notificaciones: crear por usuarios, leer/eliminar por locales

- **Índices de Firestore**: Se necesitan índices compuestos para:
  - `notifications`: `venueId` + `timestamp` (desc)
  - `notifications`: `venueId` + `read`
  - `messages`: `timestamp` (asc) dentro de cada chat

- **Optimización**: 
  - Los listeners de chat se desuscriben al cerrar el modal
  - Las notificaciones se actualizan cada 30 segundos
  - Límite de 50 notificaciones por consulta

## Archivos Modificados

1. **index.html**: Añadido modal de chat
2. **style.css**: Añadidos estilos para chat, notificaciones y badges
3. **app.js**: Añadidas funciones de chat, notificaciones y gestión de estado
