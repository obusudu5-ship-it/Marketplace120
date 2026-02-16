import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';
import { Listing } from './Listing';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  listingId: string;

  @Column()
  reviewerId: string;

  @Column()
  revieweeId: string;

  @Column()
  orderId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'simple-array', default: [] })
  aspects: string[]; // ['communication', 'accuracy', 'shipping', 'quality']

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.givenReviews)
  reviewer: User;

  @ManyToOne(() => User, user => user.receivedReviews)
  reviewee: User;

  @ManyToOne(() => Listing, listing => listing.reviews)
  listing: Listing;
}