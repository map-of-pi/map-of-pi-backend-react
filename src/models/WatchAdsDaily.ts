import { Schema, model, Types } from 'mongoose';

export interface IWatchAdsDaily {
  userId: Types.ObjectId;
  day: string;
  earnedSecs: number;
  createdAt: Date;
  updatedAt: Date;
}

const WatchAdsDailySchema = new Schema<IWatchAdsDaily>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, immutable: true },
  day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  earnedSecs: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

WatchAdsDailySchema.index({ userId: 1, day: 1 }, { unique: true });

export const WatchAdsDaily = model<IWatchAdsDaily>('WatchAdsDaily', WatchAdsDailySchema);
