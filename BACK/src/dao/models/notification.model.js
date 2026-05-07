import mongoose from "mongoose";

const collection = 'Notification';

const schema = new mongoose.Schema({
    adminId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    message:{
        type: String,
        required: true
    },
    receivers:{
        type: String,
        enum: ['all', 'specific'],
        required: true
    },
    studentIds:[{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    }],
    relatedClass:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Class',
        required: false
    },
    sent:{
        type: Number,
        default: 0
    },
    date:{
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const notificationModel = mongoose.model(collection, schema);

export default notificationModel;