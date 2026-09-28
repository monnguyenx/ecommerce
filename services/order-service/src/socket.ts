import { Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null

export type OrderEventType =
  | 'ORDER_CREATED'
  | 'DEPOSIT_CONFIRMED'
  | 'CHECKPOINT_UPDATED'
  | 'EVENT_ADDED'
  | 'ORDER_UPDATED'
  | 'QC_UPDATED'
  | 'QC_APPROVED'
  | 'QC_REJECTED'

export interface OrderLiveEvent {
  orderId: string
  orderCode: string
  type: OrderEventType
  title: string
  message: string
  timestamp: string
  order?: any
}

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT']
    }
  })

  io.on('connection', (socket) => {
    // Client can join a specific room for an order
    socket.on('join_order', (orderId: string) => {
      if (orderId) {
        socket.join(`order:${orderId}`)
      }
    })

    socket.on('leave_order', (orderId: string) => {
      if (orderId) {
        socket.leave(`order:${orderId}`)
      }
    })

    socket.on('disconnect', () => {
      // client disconnected
    })
  })

  return io
}

export function broadcastOrderEvent(event: Omit<OrderLiveEvent, 'timestamp'>): void {
  if (!io) return

  const payload: OrderLiveEvent = {
    ...event,
    timestamp: new Date().toISOString()
  }

  // Broadcast to all connected clients
  io.emit('order_notification', payload)

  // Broadcast to specific order room
  if (event.orderId) {
    io.to(`order:${event.orderId}`).emit('order_detail_updated', payload)
  }
}
