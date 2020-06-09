import UserOrder from '../models/userSchema'

/**
 * @type {import('@wykerd/discord-framework').Parser.CommandHandler}
 */
const handler = async (message) => {
    const member = await UserOrder.findOne({ user_id: message.author.id });

    if (!member) {
        const n_mem = new UserOrder({
            user_id: message.author.id,
            subscribed: true
        });

        await n_mem.save();
    } else {
        member.subscribed = true;
        await member.save();
    }

    message.author.send('You\'ve successfully subscribed to market notifications');
}

export default handler;