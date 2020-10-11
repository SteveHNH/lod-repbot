const Discord = require('discord.js');
const client = new Discord.Client();
const sqlite3 = require('sqlite3');

require('dotenv').config()

let db = new sqlite3.Database('./rep.db', (err) => {
    if (err) {
        console.error(err.message)
    }
    console.log('Connected to reputation database')
})

let getRep = `SELECT rep FROM reputation where username = ?`;
let insert = `INSERT OR IGNORE into reputation (username, user) values (?, ?)`;
let setRep = `UPDATE reputation SET rep = rep + 1, user = ? WHERE username = ?`;
let getRank = `SELECT user, rep FROM reputation ORDER BY rep DESC LIMIT 10`;

client.on('ready', () => {
 console.log(`Logged in as ${client.user.tag}!`);
 });

client.on('message', msg => {
    const author = msg.author;

    const self_query = /^\?rep\s*$/;
    const user_query = /^\?rep\s\<\@\!\d+\>\s*$/;
    const help = /^[\!|\?]rep\shelp\s*$/;
    const trigger = /^\!rep\s\<\@\!*\d+\>\s*/;
    const rank = /^\?rep\srank\s*$/;

    if (msg.content.match(self_query)) {
        db.get(getRep, [author.id], (err, row) => {
            if (err) {
                console.log(err)
                return console.error(`Unable to get reputation value for ${author.username}`)
            }
            else {
                msg.channel.send(`${author.username} rep is currently ${row.rep}`)
            }
        });
    };

    if (msg.content.match(user_query)) {
        const user = msg.mentions.users.first();
        const member = msg.guild.member(user);
        if (user) {
            if (member) {
                db.get(getRep, [user.id], (err, row) => {
                    if (err) {
                        console.log(err)
                        return console.error(`Unable to get reputation value for ${user.username}`)
                    }
                    else {
                        msg.channel.send(`${member} rep is currently ${row.rep}`)
                    }
                });
            }
        };
    };

    if (msg.content.match(trigger)) {
        const user = msg.mentions.users.first();
        const member = msg.guild.member(user);
        if (user) {
            if (member) {
                if (author === member.id) {
                    msg.channel.send(`Nice try, ${member}. You can't add rep to yourself`)
                    return console.log(`${user.tag} tried to update their own rep`)
                };
                db.run(insert, [user.id, user.username], (err, row) => {
                    if (err) {
                        console.log(err)
                        return console.error(`Unable to insert/update row for ${user.username}`);
                    }
                });
                db.run(setRep, [user.username, user.id], (err, row) => {
                    if (err) {
                        console.log(err)
                        return console.error(`Unable to increase rep for ${user.username}`);
                    }
                });
                db.get(getRep, [user.id], (err, row) => {
                    if (err) {
                        console.log(err)
                        return console.error(`Unable to get reputation value for ${user.username}`)
                    }
                    else {
                        msg.channel.send(`${member} rep increased to ${row.rep}`)
                    }
                });
            }
            else {
                msg.channel.send(`${member} is not a member on this server`);
            }
        }
    };

    if (msg.content.match(help)) {
        author.send(`Repbot Help:
                     >>> Access Help: \`?rep help\`
Get your current rep: \`?rep\`
Get someone else's rep: \`?rep @user\`
Give someone rep: \`!rep @user\`
Get current rep rankings: \`?rep rank\``);
    };

    if (msg.content.match(rank)) {
        var ranks = []       
        db.all(getRank, [], (err, rows) => {
            if (err) {
                console.log(err);
                return console.error(`Unable to get top 10 rankings`);
            }
            rows.forEach((row) => {
                ranks.push(`${row.user} |  ${row.rep}`)
            })
            let listing = ranks.join('\n')
            msg.channel.send(`Top 10 Rep:
>>> \`${listing}\``)
        });
    };
});

client.login(process.env.DISCORD_TOKEN)

console.log(client)
