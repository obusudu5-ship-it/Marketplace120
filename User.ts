import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Listing } from './Listing';
import { Order } from './Order';
import { Review } from './Review';
import { Message } from './Message';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: ['buyer', 'seller', 'both'], default: 'both' })
  userType: 'buyer' | 'seller' | 'both';

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeConnectId: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  verified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Listing, listing => listing.seller)
  listings: Listing[];

  @OneToMany(() => Order, order => order.buyer)
  purchasedOrders: Order[];

  @OneToMany(() => Order, order => order.seller)
  soldOrders: Order[];

  @OneToMany(() => Review, review => review.reviewer)
  givenReviews: Review[];

  @OneToMany(() => Review, review => review.reviewee)
  receivedReviews: Review[];

  @OneToMany(() => Message, message => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, message => message.receiver)
  receivedMessages: Message[];
}