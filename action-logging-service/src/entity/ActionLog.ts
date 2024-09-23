import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity('actions')
export class ActionLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  shop_id!: number;

  @Column()
  plu!: string;

  @Column()
  action!: string;

  @CreateDateColumn({ type: 'timestamp' })
  date!: Date;
}
