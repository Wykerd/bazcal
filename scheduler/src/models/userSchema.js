import mongoose from 'mongoose'

const userOrderSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    orders: {
        type: [ String ],
        default: []
    },
    subscribed: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model('UserOrders', userOrderSchema);