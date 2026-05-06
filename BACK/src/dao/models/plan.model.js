import mongoose from "mongoose";

const collection = 'Plan';

const schema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    WeeklyClasses:{
        type: Number,
        required: true
    },
    price:[{
        type: Number,
        required: true
    }],
    isActive:{
        type: Boolean,
        defaul: true
    }
}, { timestamps: true });

const planModel = mongoose.model(collection,schema);

export default planModel;