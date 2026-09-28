import { io, Socket } from 'socket.io-client'
import type { Order } from './orderApi'

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
  order?: Order
}

const ORDER_SOCKET_URL = import.meta.env.VITE_ORDER_API_URL || 'http://localhost:8004'

class SocketService {
  private socket: Socket | null = null
  private listeners: Array<(event: OrderLiveEvent) => void> = []

  connect() {
    if (this.socket && this.socket.connected) return

    this.socket = io(ORDER_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    })

    this.socket.on('connect', () => {
      console.log('⚡ [socketService] Đã kết nối Socket.io với order-service (:8004)')
    })

    this.socket.on('order_notification', (event: OrderLiveEvent) => {
      this.listeners.forEach((callback) => callback(event))
    })

    this.socket.on('order_detail_updated', (event: OrderLiveEvent) => {
      this.listeners.forEach((callback) => callback(event))
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 [socketService] Mất kết nối Socket.io với order-service')
    })
  }

  joinOrder(orderId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_order', orderId)
    }
  }

  leaveOrder(orderId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_order', orderId)
    }
  }

  subscribe(callback: (event: OrderLiveEvent) => void) {
    this.listeners.push(callback)
    if (!this.socket || !this.socket.connected) {
      this.connect()
    }

    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

export const socketService = new SocketService()
