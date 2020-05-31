import mongoose from 'mongoose'

interface CacheDocument extends mongoose.Document {
    timestamp : Date;
    response: any;
}

const cacheSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: new Date()
    },
    response: {
        type: {}
    }
});

export default mongoose.model<CacheDocument>('APIResponses', cacheSchema);