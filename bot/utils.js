const nodemailer = require('nodemailer')
const dotenv = require('dotenv').config()

const CronJob = require('cron').CronJob

const sendNotifications = async (username, email = null, discordName = null, client) => {

    console.log(` Send Notifications to ${email} and ${discordName} for ${username}`);

    if (email !== null) {
        await SendMailNotification(email).catch(err => console.log(err))
    }

    if (discordName === null) return
    //Send Discord Notifications
    await SendDiscordNotification(client, discordName).catch(err => console.log(err))

}

async function SendDiscordNotification(client, name) {

    return new Promise(async (resolve, reject) => {

        try {

            let username = name

            let guild = await client.guilds.fetch(process.env.guildId)

            guild.members.fetch().then(m => {

                let members = m.map(async function (u) {

                    if (u.user.username === username) {

                        if (u.user) {
                            let user = await client.users.fetch(u.user.id);
                            await user.send("Reminder")
                        }


                        console.log("Discord Notification Send Successfully")
                        resolve()
                    }

                })
            })


        } catch (err) {
            console.log(err.message);
            reject(err)
        }

    })



}

async function SendMailNotification(email) {

    return new Promise((resolve, reject) => {

        const transporter = nodemailer.createTransport({

            port: 465,
            host: "smtp.gmail.com",
            auth: {
                user: process.env.NEXT_PUBLIC_NODEMAILER_EMAIL,
                pass: process.env.NEXT_PUBLIC_NODEMAILER_PASS,
            },

            secure: true,

        });

        const mailData = {

            from: process.env.NEXT_PUBLIC_NODEMAILER_EMAIL,
            to: email,
            subject: "Reminder!",
            html: `Reminder`

        };

        transporter.sendMail(mailData, function (err, info) {

            if (err) {
                console.log(err);
                reject(err)
            }
            else {

                console.log( "Email Sent Successfully" );
                resolve(info)

            }

        });

    })


}

/**
 * updateJob() will update the current cron job mapped to username 
 */

async function updateJob(username, hr, min , map , client) {

	//Update the time 
	hr = Math.floor(hr + (min + map[username].data.interval) / 60)
	min = (min + map[username].data.interval) % 60

	let time = ` ${min} ${hr} * * *`

	console.log(` New Job  Scheduled for ${username} at ${time} `);

	//Create a job for the user
	let job = new CronJob(
		time,
		async function () {

			sendNotifications( map[username].data.username, map[username].data.email, map[username].data.discordName, client)

			map[username].job.stop() // stop the current job
			await updateJob(username, hr, min , map , client ) // update job

		},
		null,
		true,
	);

	map[username].job = job



}

module.exports = { sendNotifications , updateJob }