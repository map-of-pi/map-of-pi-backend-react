import { Schema, model, Types } from 'mongoose';

export interface IAdCredit {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  segmentNo: number;
  secs: number;
  sdkImpressionId?: string;
  creditedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdCreditSchema = new Schema<IAdCredit>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, immutable: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'WatchAdsSession', required: true, index: true, immutable: true },
  segmentNo: { type: Number, required: true, min: 1 },
  secs: { type: Number, required: true, min: 1 },
  sdkImpressionId: { type: String },
  creditedAt: { type: Date, default: () => new Date() },
}, { timestamps: true });

AdCreditSchema.index({ sessionId: 1, segmentNo: 1 }, { unique: true });

export const AdCredit = model<IAdCredit>('AdCredit', AdCreditSchema);
