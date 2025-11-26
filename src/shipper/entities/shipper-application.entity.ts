import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "src/users/entities/user.entity";

export enum ApplicationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity('shipper_applications')
export class ShipperApplication {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'user_id'})
    userId: number;

    @Column({type: 'json', name: 'application_data', nullable: true})
    applicationData: any;

    @Column({type: 'text', name: 'resume_text', nullable: true})
    resumeText: string;

    @Column({nullable: true})
    documents: string;

    @Column({
        type: 'enum',
        enum: ApplicationStatus,
        default: ApplicationStatus.PENDING,
    })
    status: ApplicationStatus;

    @Column({type: 'text', name: 'admin_note', nullable: true})
    adminNote: string;

    @Column({name: 'reviewed_by', nullable: true})
    reviewedBy: number;

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({name: 'user_id'})
    user: User;

    @ManyToOne(() => User)
    @JoinColumn({name: 'reviewed_by'})
    reviewer: User;
}