import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './User';
import { Order } from './Order';
import { Review } from './Review';

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: ['product', 'service', 'rental', 'digital'] })
  category: 'product' | 'service' | 'rental' | 'digital';

  @Column({ type: 'enum', enum: ['active', 'inactive', 'sold'], default: 'active' })
  status: 'active' | 'inactive' | 'sold';

  @Column({ type: 'simple-array', default: [] })
  images: string[];

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'text', nullable: true })
  specifications: string;

  @Column({ default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: 0 })
  views: number;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: true })
  allowOffers: boolean;

  // For rental listings
  @Column({ nullable: true })
  bedrooms: number;

  @Column({ nullable: true })
  bathrooms: number;

  @Column({ nullable: true })
  squareFeet: number;

  @Column({ nullable: true })
  availableFrom: Date;

  @Column({ nullable: true })
  availableUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.listings, { onDelete: 'CASCADE' })
  seller: User;

  @Column()
  sellerId: string;

  @OneToMany(() => Order, order => order.listing)
  orders: Order[];

  @OneToMany(() => Review, review => review.listing)
  reviews: Review[];
}