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




 // Currently not used, to lazy to impliment elegant solution




import UserOrder from '../models/userSchema'

/**
 * @type {import('@wykerd/discord-framework').Parser.CommandHandler}
 */
const handler = async (message) => {
    const member = await UserOrder.findOne({ user_id: message.author.id })

    if (!member) {
        const n_mem = new UserOrder({
            user_id: message.author.id,
            subscribed: true
        })

        await n_mem.save()
    } else {
        member.subscribed = true
        await member.save()
    }

    message.author.send('You\'ve successfully subscribed to market notifications')
}

export default handler