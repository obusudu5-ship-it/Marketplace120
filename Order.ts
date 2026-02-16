import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';
import { Listing } from './Listing';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  listingId: string;

  @Column()
  buyerId: string;

  @Column()
  sellerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  sellerAmount: number;

  @Column({ type: 'enum', enum: ['pending', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'] })
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';

  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  shippingAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.purchasedOrders)
  buyer: User;

  @ManyToOne(() => User, user => user.soldOrders)
  seller: User;

  @ManyToOne(() => Listing, listing => listing.orders)
  listing: Listing;
}