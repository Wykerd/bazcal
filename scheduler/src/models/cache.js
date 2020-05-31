import mongoose from 'mongoose'

const cacheSchema = new mongoose.Schema({
    timestamp: {
        type: Date
    },
    response: {
        type: {}
    }
});

export default mongoose.model('APIResponses', cacheSchema);