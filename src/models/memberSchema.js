/**
 *  This file is part of Bazcal.
 *
 *  Bazcal is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Bazcal is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Bazcal.  If not, see <https://www.gnu.org/licenses/>.
 */
import mongoose from 'mongoose'

const userOrderSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    channel_id: {
        type: String
    },
    server_id: {
        type: String,
        required: true
    },
    last_message: {
        type: Date,
        required: true
    },
    orders: {
        type: [ String ],
        default: []
    }
})

export default mongoose.model('Members', userOrderSchema)