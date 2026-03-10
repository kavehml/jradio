import { Model, Optional } from 'sequelize';
export type RequisitionStatus = 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'reported' | 'returned_to_pool';
interface RequisitionAttributes {
    id: number;
    createdAt: Date;
    requestedDate: Date | null;
    urgencyWindowHours: number | null;
    calculatedDueDate: Date | null;
    patientIdOrTempLabel: string;
    isNewExternalPatient: boolean;
    orderingDoctorName: string;
    orderingClinic: string;
    site: string;
    status: RequisitionStatus;
}
interface RequisitionCreationAttributes extends Optional<RequisitionAttributes, 'id' | 'createdAt' | 'requestedDate' | 'urgencyWindowHours' | 'calculatedDueDate' | 'status'> {
}
export declare class Requisition extends Model<RequisitionAttributes, RequisitionCreationAttributes> implements RequisitionAttributes {
    id: number;
    createdAt: Date;
    requestedDate: Date | null;
    urgencyWindowHours: number | null;
    calculatedDueDate: Date | null;
    patientIdOrTempLabel: string;
    isNewExternalPatient: boolean;
    orderingDoctorName: string;
    orderingClinic: string;
    site: string;
    status: RequisitionStatus;
}
export {};
//# sourceMappingURL=Requisition.d.ts.map