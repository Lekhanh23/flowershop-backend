import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "src/users/entities/user.entity";

export enum ShipperStatus {
    AVAILABLE = 'available',
    UNAVAILABLE = 'unavailable',
    SUSPENDED = 'suspended',
}
@Entity('shipper_profile')
export class ShipperProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'user_id'})
    userId: number;

    @Column({name: 'national_id', nullable: true})
    nationalId: string;

    @Column({name: 'license_number', nullable: true})
    licenseNumber: string;

    @Column({name: 'vehicle_type', nullable: true})
    vehicleType: string;

    @Column({name: 'vehicle_plate', nullable: true})
    vehiclePlate: string;

    @Column({name: 'bank_account', nullable: true})
    bankAccount: string;

    @Column({name: 'is_verified', default: false})
    isVerified: boolean;

    @Column({
        type: 'enum',
        enum: ShipperStatus,
        default: ShipperStatus.UNAVAILABLE
    })
    status: ShipperStatus

    @OneToOne(() => User, (user) => user.shipperProfile)
    @JoinColumn({name: 'user_id'})
    user: User;
}