import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// Define the User interface
export interface IUser extends Document {
    username: string; // login identifier (email or handle) - NOT exposed in tokens
    password: string;
    nickname: string;
    publicId: string; // opaque UUID exposed to clients / JWT subject
    tokenVersion: number; // increment to revoke all sessions
    comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        password: {
            type: String,
            required: true,
        },
        nickname: {
            type: String,
            required: true,
            unique: true,
        },
        publicId: {
            type: String,
            unique: true,
            index: true
        },
        // tokenVersion maps to JWT payload claim `ver` to allow global user session invalidation
        tokenVersion: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving & ensure publicId
UserSchema.pre<IUser>('save', async function (next) {
    if (!this.publicId) {
        this.publicId = randomUUID();
    }
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
});

// Compare passwords
UserSchema.methods.comparePassword = function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
