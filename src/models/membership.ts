import mongoose from "mongoose";
import { MembershipType } from "./enums/membershipType";

const membershipSchema = new mongoose.Schema(
	{
		pi_uid: { 
			type: String, 
			required: true 
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
			validate: {
				validator: (value:any) => value >= 0,
				message: "mappi_balance must be a non-negative number.",
			},
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

// Indexing for faster queries on user_id
membershipSchema.index({ pi_uid: 1 });

export default mongoose.model('Membership', membershipSchema);