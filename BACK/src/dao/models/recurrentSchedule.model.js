import mongoose from "mongoose";
 
const collection = 'RecurrentSchedule';
 
const schema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    professorId:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    daysWeek:[{
        type: Number,
        min: 0, max: 6
    }],
    startTime:{
        type: String,        
        required: true
    },
    endTime:{
        type: String,
        required: true
    },
    maxQuota:{
        type: Number,
        required: true
    },
    isActive:{
        type: Boolean,       
        default: true
    }
}, { timestamps: true });
 
const recurrentScheduleModel = mongoose.model(collection, schema);
 
export default recurrentScheduleModel;
 