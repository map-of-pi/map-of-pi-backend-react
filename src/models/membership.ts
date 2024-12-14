import mongoose from "mongoose";
import { MembershipType } from "./enums/memberShipType";

const membershipSchema = new mongoose.Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
			required: true,
		},
		membership_class: {
			type: String,
			required: true,
			default: MembershipType.CASUAL,
    		enum: Object.values(MembershipType),
		},
		mappi_balance: {
			type: Number,
			default: 0,
			required: true,
		},
		membership_expiration: {
			type: Date,
			required: false,
			default: null,
		},
		mappi_used_to_date: {
			type: Number,
			required: true,
			default: 0,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('Membership', membershipSchema);