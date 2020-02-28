const Discord = require("discord.js");
const rbx = require('noblox.js');
const client = new Discord.Client();
const config = require("./config.json");
const chalk = require('chalk');
const figlet = require('figlet');

rbx.cookieLogin(config.cookie);

client.on("ready", async () => {
    console.log(chalk.yellow(figlet.textSync('qbot', { horizontalLayout: 'full' })));
    console.log(chalk.yellow(`Bot started! This bot is currently helping ${client.users.size} users in ${client.users.size} channels of ${client.guilds.size} servers.`));
});

async function getRankName(func_group, func_user){
    let rolename = await rbx.getRankNameInGroup(func_group, func_user);
    return rolename;
}

async function getRankID(func_group, func_user){
    let role = await rbx.getRankInGroup(func_group, func_user);
    return role;
}

async function GetRankFromName(func_rankname, func_group){
    let roles = await rbx.getRoles(func_group);
    let role = await roles.find(rank => rank.name == func_rankname);
    if(!role){
        return 'NOT_FOUND';
    }
    return role.rank;
}

let onShout = rbx.onShout(config.groupId);
onShout.on('data', function (shout) {
    if(config.shoutchannelid === 'false') return;
    var shoutchannel = client.channels.get(config.shoutchannelid);
    if(shout.body){
        shoutchannel.send({embed: {
            color: 11253955,
            description: shout.body,
            title: `Posted by ${shout.poster.username}`,
            footer: {
                text: 'Shout Announcement'
            },
            thumbnail: {
                url: `http://www.roblox.com/Thumbs/Avatar.ashx?x=150&y=150&Format=Png&username=${shout.poster.username}`
            },
            timestamp: new Date()
        }});
    } else {
        shoutchannel.send({embed: {
            color: 11253955,
            description: '*Shout cleared.*',
            title: `Posted by ${shout.poster.username}`,
            footer: {
                text: 'Shout Announcement'
            },
            thumbnail: {
                url: `http://www.roblox.com/Thumbs/Avatar.ashx?x=150&y=150&Format=Png&username=${shout.poster.username}`
            },
            timestamp: new Date()
        }});
    }
});
onShout.on('error', function (err) {
    console.log('Issue with shout announcements: ' + err);
});

client.on("message", async message => {
    if(message.author.bot) return;
    if(message.content.indexOf(config.prefix) !== 0) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === "help") {
        return message.channel.send({embed: {
            color: 11253955,
            description: `Mis comandos son: \`${config.prefix}help\`, \`${config.prefix}setrank <user> <rank number>\`, \`${config.prefix}promote <user>\`, \`${config.prefix}demote <user>\`, \`${config.prefix}fire <user>\`, \`${config.prefix}shout <msg>\`, and \`${config.prefix}clearshout\`.`,
            author: {
                name: message.author.tag,
                icon_url: message.author.displayAvatarURL
            }
        }});
    };

    if(command === "setrank") {
        if(!message.member.roles.some(r=>["Ranking Permissions"].includes(r.name)) )
            return message.channel.send({embed: {
                color: 15406156,
                description: "Precisas el rol de `Ranking Permissions` Para usar este comando.",
                author: {
                    name: message.author.tag,
                    icon_url: message.author.displayAvatarURL
                }
            }});
            var username = args[0]
            var rankIdentifier = Number(args[1]);
            if (!rankIdentifier){
                var rankIdentifier = args.slice(1).join(' ');
                if(!rankIdentifier){
                    return message.channel.send({embed: {
                        color: 15406156,
                        description: "Porfavor especifica un nombre.",
                        author: {
                            name: message.author.tag,
                            icon_url: message.author.displayAvatarURL
                        }
                    }});
                }
                GetRankFromName(rankIdentifier, config.groupId).then(function(result){
                    rankIdentifier = result;
                });
            }
            if (username){
                rbx.getIdFromUsername(username)
                .then(function(id){
                    rbx.getRankInGroup(config.groupId, id)
                    .then(function(rank){
                        if(config.maximumRank <= rank){
                            message.channel.send({embed: {
                                color: 15406156,
                                description: "Este rango no puede ser cambiado por el BOT.",
                                author: {
                                    name: message.author.tag,
                                    icon_url: message.author.displayAvatarURL
                                }
                            }});
                        } else {
                            if(rankIdentifier == 'NOT_FOUND'){
                                return message.channel.send({embed: {
                                    color: 15406156,
                                    description: "Rango No encontrado.",
                                    author: {
                                        name: message.author.tag,
                                        icon_url: message.author.displayAvatarURL
                                    }
                                }});
                            }
                            rbx.setRank(config.groupId, id, rankIdentifier)
                            .then(function(newRole){
                                getRankName(config.groupId, id)
                                .then(function(rolename){
                                    message.channel.send({embed: {
                                        color: 8117429,
                                        description: `Haz rankeado ${username} a ${rolename} (${rankIdentifier})!`,
                                        author: {
                                            name: message.author.tag,
                                            icon_url: message.author.displayAvatarURL
                                        }
                                    }});
                                    if(config.logchannelid === 'false') return;
                                    var logchannel = message.guild.channels.get(config.logchannelid);
                                    logchannel.send({embed: {
                                        color: 11253955,
                                        description: `<@${message.author.id}> Rankeo ${username} to ${rolename} (${rankIdentifier}).`,
                                        author: {
                                            name: message.author.tag,
                                            icon_url: message.author.displayAvatarURL
                                        },
                                        footer: {
                                            text: 'Action Logs'
                                        },
                                        timestamp: new Date(),
                                        thumbnail: {
                                            url: `http://www.roblox.com/Thumbs/Avatar.ashx?x=150&y=150&Format=Png&username=${username}`
                                        }
                                    }});
                                });
                            }).catch(function(err){
                                console.log(chalk.red('Issue with setRank: ' + err));
                                message.channel.send({embed: {
                                    color: 15406156, 
                                    description: "Oops! Algo salio mal. El problema ha sido enviado A la consola.",
                                    author: {
                                        name: message.author.tag,
                                        icon_url: message.author.displayAvatarURL
                                    }
                                }});
                            })
                        }
                    }).catch(function(err){
                        message.channel.send({embed: {
                            color: 15406156,
                            description: "Oops! Algo salio mal. El problema ha sido enviado A la consola.",
                            author: {
                                name: message.author.tag,
                                icon_url: message.author.displayAvatarURL
                            }
                        }});
                    });
                }).catch(function(err){
                    message.channel.send({embed: {
                        color: 15406156,
                        description: `Oops! ${username} No existe en la database de ROBLOX. Tal vez escribiste mal.`,
                        author: {
                            name: message.author.tag,
                            icon_url: message.author.displayAvatarURL
                        }
                    }});
                });
            } else {
                message.channel.send({embed: {
                    color: 15406156,
                    description: "Porfavor especifica un nombre.",
                    author: {
                        name: message.author.tag,
                        icon_url: message.author.displayAvatarURL
                    }
                }});
            }
            return;
    }

    if(command === "promote") {
        if(!message.member.roles.some(r=>["Ranking Permissions"].includes(r.name)) )
            return message.channel.send({embed: {
                color: 15406156,
                description: "Necesitas el rol`Ranking Permissions`Para usar este comando.",
                author: {
                    name: message.author.tag,
                    icon_url: message.author.displayAvatarURL
                }
            }});
            var username = args[0]
            if (username){
                rbx.getIdFromUsername(username)
                .then(function(id){
                    rbx.getRankInGroup(config.groupId, id)
                    .then(function(rank){
                        if(config.maximumRank <= rank){
                            message.channel.send({embed: {
                                color: 15406156,
                                description: "Este rango no puede ser dado por el bot.",
                                author: {
                                    name: message.author.tag,
                                    icon_url: message.author.displayAvatarURL
                                }
                            }});
                        } else {
                            rbx.promote(config.groupId, id)
                            .then(function(newRole){
                                getRankName(config.groupId, id)
                                .then(function(rolename){
                                    getRankID(config.groupId, id)
                                    .then(function(roleid){
                                        message.channel.send({embed: {
                                            color: 8117429,
                                            description: `Has Exitosame promovido ${username} to ${rolename} (${roleid})!`,
                                            author: {
                                                name: message.author.tag,
                                                icon_url: message.author.displayAvatarURL
                                            }
                                        }});
                                    })
                                });
                                if(config.logchannelid === 'false') return;
                                var logchannel = message.guild.channels.get(config.logchannelid);
                                logchannel.send({embed: {
                                    color: 11253955,
                                    description: `<@${message.author.id}> Ha promovido ${username}.`,
                                    author: {
                                        name: message.author.tag,
                                        icon_url: message.author.displayAvatarURL
                                    },
                                    footer: {
                                        text: 'Action Logs'
                                    },
                                    timestamp: new Date(),
                                    thumbnail: {
                                        url: `http://www.roblox.com/Thumbs/Avatar.ashx?x=150&y=150&Format=Png&username=${username}`
                                    }
                                }});
                            }).catch(function(err){
                                console.log(chalk.red('Issue with promote: ' + err));
                                message.channel.send({embed: {
                                    color: 15406156, 
                                    description: "Oops! Algo salio mal. El problema ha sido enviado a la consola.",
                                    author: {
                                        name: message.author.tag,
                                        icon_url: message.author.displayAvatarURL
                                    }
                                }});
                            })
                        }
                    }).catch(function(err){
                        message.channel.send({embed: {
                            color: 15406156,
                            description: "Oops! Algo salio mal. El problema ha sido enviado a la consola.",
                            author: {
                                name: message.author.tag,
                                icon_url: message.author.displayAvatarURL
                            }
                        }});
                    });
                }).catch(function(err){
                    message.channel.send({embed: {
                        color: 15406156,
                        description: `Oops! ${username} No existe en la database de ROBLOX. Tal vez lo escribiste mal?`,
                        author: {
                            name: message.author.tag,
                            icon_url: message.author.displayAvatarURL
                        }
                    }});
                });
            } else {
                message.channel.send({embed: {
                    color: 15406156,
                    description: "Porfavor especifica un nombre.",
                    author: {
                        name: message.author.tag,
                        icon_url: message.author.displayAvatarURL
                    }
                }});
            }
            return;
    }

    if(command === "demote") {
        if(!message.member.roles.some(r=>["Ranking Permissions"].includes(r.name)) )
            return message.channel.send({embed: {
                color: 15406156,
                description: "Necesitas el rol `Ranking Permissions` Para usar este comando.",
                author: {
                    name: message.author.tag,
                    icon_url: message.author.displayAvatarURL
                }
            }});
            var username = args[0]
            if (username){
                rbx.getIdFromUsername(username)
                .then(function(id){
                    rbx.getRankInGroup(config.groupId, id)
                    .then(function(rank){
                        if(config.maximumRank <= rank){
                            message.channel.send({embed: {
                                color: 15406156,
                                description: "Este rango no puede ser dado por el BOT.",
                                author: {
                                    name: message.author.tag,
                                    icon_url: message.author.displayAvatarURL
                                }
                            }});
                        } else {
                            rbx.demote(config.groupId, id)
                            .then(function(newRole){
                                getRankName(config.groupId, id)
                                .then(function(rolename){
                                    getRankID(config.groupId, id)
                                    .then(function(roleid){
                                        message.channel.send({embed: {
                                            color: 8117429,
                                            description: `Has bajado el rango de ${username} to ${rolename} (${roleid})!`,
                                            author: {
                                                name: message.author.tag,
                                                icon_url: message.author.displayAvatarURL
                                            }
                                        }});
                                    })
                                });
                                if(config.logchannelid === 'false') return;
                                var logchannel = message.guild.channels.get(config.logchannelid);
                                logchannel.send({embed: {
                                    color: 11253955,
                                    description: `<@${message.author.id}> ha bajado el rango de ${username}.`,
                                    author: {
                                        name: message.author.tag,
                                        icon_url: message.author.displayAvatarURL
                                    },
                                    footer: {
                                        text: 'Action Logs'
                                    },
                                    timestamp: new Date(),
                                    thumbnail: {
                                        url: `http://www.roblox.com/Thumbs/Avatar.ashx?x=150&y=150&Format=Png&username=${username}`
                                    }
                                }});
                            }).catch(function(err){
                                console.log(chalk.red('Issue with demote: ' + err));
                                message.channel.send({embed: {
                                    color: 15406156, 
                                    description: "Oops! Algo salio mal. El problema ha sido enviado a la  consola.",
                                    author: {
                                        name: message.author.tag,
                                        icon_url: message.author.displayAvatarURL
                                    }
                                }});
                            })
                        }
                    }).catch(function(err){
                        message.channel.send({embed: {
                            color: 15406156,
                            description: "Oops! Algo salio mal. El problema ha sido enviado a la  consola.",
                            author: {
                                name: message.author.tag,
                                icon_url: message.author.displayAvatarURL
                            }
                        }});
                    });
                }).catch(function(err){
                    message.channel.send({embed: {
                        color: 15406156,
                        description: `Oops! ${username} No existe en la database de ROBLOX. Tal vez lo escribiste mal?`,
                        author: {
                            name: message.author.tag,
                            icon_url: message.author.displayAvatarURL
                        }
                    }});
                });
            } else {
                message.channel.send({embed: {
                    color: 15406156,
                    description: "Porfavor especifica un nombre.",
                    author: {
                        name: message.author.tag,
                        icon_url: message.author.displayAvatarURL
                    }
                }});
            }
            return;
    }

    if(command === "fire") {
        if(!message.member.roles.some(r=>["Ranking Permissions"].includes(r.name)) )
            return message.channel.send({embed: {
                color: 15406156,
                description: "Necesitas el rol `Ranking Permissions` para usar este comando.",
                author: {
                    name: message.author.tag,
                    icon_url: message.author.displayAvatarURL
                }
            }});
            var username = args[0]
            if (username){
                rbx.getIdFromUsername(username)
                .then(function(id){
                    rbx.getRankInGroup(config.groupId, id)
                    .then(function(rank){
                        if(config.maximumRank <= rank){
                            message.channel.send({embed: {
                                color: 15406156,
                                description: "Este rango no puede ser cambiado por el bot.",
                                author: {
                                    name: message.author.tag,
                                    icon_url: message.author.displayAvatarURL
                                }
                            }});
                        } else {
                            rbx.setRank(config.groupId, id, 1)
                            .then(function(newRole){
                                getRankName(config.groupId, id)
                                .then(function(rolename){
                                    getRankID(config.groupId, id)
                                    .then(function(roleid){
                                        message.channel.send({embed: {
                                            color: 8117429,
                                            description: `Has despedido a ${username}.`,
                                            author: {
                                                name: message.author.tag,
                                                icon_url: message.author.displayAvatarURL
                                            }
                                        }});
                                    })
                                });
                                if(config.logchannelid === 'false') return;
                                var logchannel = message.guild.channels.get(config.logchannelid);
                                logchannel.send({embed: {
                                    color: 11253955,
                                    description: `<@${message.author.id}> Ha despedido ${username}.`,
                                    author: {
                                        name: message.author.tag,
                                        icon_url: message.author.displayAvatarURL
                                    },
                                    footer: {
                                        text: 'Action Logs'
                                    },
                                    timestamp: new Date(),
                                    thumbnail: {
                                        url: `http://www.roblox.com/Thumbs/Avatar.ashx?x=150&y=150&Format=Png&username=${username}`
                                    }
                                }});
                            }).catch(function(err){
                                console.log(chalk.red('Issue with setRank (fire): ' + err));
                                message.channel.send({embed: {
                                    color: 15406156, 
                                    description: "Oops! Something went wrong. The issue has been logged to the bot console.",
                                    author: {
                                        name: message.author.tag,
                                        icon_url: message.author.displayAvatarURL
                                    }
                                }});
                            })
                        }
                    }).catch(function(err){
                        message.channel.send({embed: {
                            color: 15406156,
                            description: "Oops! Something went wrong. The issue has been logged to the bot console.",
                            author: {
                                name: message.author.tag,
                                icon_url: message.author.displayAvatarURL
                            }
                        }});
                    });
                }).catch(function(err){
                    message.channel.send({embed: {
                        color: 15406156,
                        description: `Oops! ${username} does not exist in the Roblox user database. Perhaps you misspelled?`,
                        author: {
                            name: message.author.tag,
                            icon_url: message.author.displayAvatarURL
                        }
                    }});
                });
            } else {
                message.channel.send({embed: {
                    color: 15406156,
                    description: "Please specify a target username.",
                    author: {
                        name: message.author.tag,
                        icon_url: message.author.displayAvatarURL
                    }
                }});
            }
            return;
    }

    if(command === 'shout'){
        if(!message.member.roles.some(r=>["Ranking Permissions", "Shout Permissions"].includes(r.name)) )
        return message.channel.send({embed: {
            color: 15406156,
            description: "You need the `Ranking Permissions` or `Shout Permissions` role to run this command.",
            author: {
                name: message.author.tag,
                icon_url: message.author.displayAvatarURL
            }
        }});
        var msg = args.slice(0).join(" ");
        if(!msg){
            return message.channel.send({embed: {
                color: 15406156,
                description: `Please specify a message. If you are trying to clear the shout, please use the \`${config.prefix}clearshout\` command instead.`,
                author: {
                    name: message.author.tag,
                    icon_url: message.author.displayAvatarURL
                }
            }});
        }
    rbx.shout(config.groupId, msg).catch(console.error);
    message.channel.send({embed: {
        color: 8117429,
        description: `Successfully sent shout.`,
        author: {
            name: message.author.tag,
            icon_url: message.author.displayAvatarURL
        }
    }});
    if(config.logchannelid === 'false') return;
    var logchannel = message.guild.channels.get(config.logchannelid);
    logchannel.send({embed: {
        color: 11253955,
        description: `<@${message.author.id}> has updated the group shout.\nMessage: ${msg}`,
        author: {
            name: message.author.tag,
            icon_url: message.author.displayAvatarURL
        },
        footer: {
            text: 'Action Logs'
        },
        timestamp: new Date()
    }});
    }

    if(command === 'clearshout'){
        if(!message.member.roles.some(r=>["Ranking Permissions", "Shout Permissions"].includes(r.name)) )
        return message.channel.send({embed: {
            color: 15406156,
            description: "You need the `Ranking Permissions` or `Shout Permissions` role to run this command.",
            author: {
                name: message.author.tag,
                icon_url: message.author.displayAvatarURL
            }
        }});
    rbx.shout(config.groupId, "").catch(console.error);
    message.channel.send({embed: {
        color: 8117429,
        description: `Successfully cleared shout.`,
        author: {
            name: message.author.tag,
            icon_url: message.author.displayAvatarURL
        }
    }});
    if(config.logchannelid === 'false') return;
    var logchannel = message.guild.channels.get(config.logchannelid);
    logchannel.send({embed: {
        color: 11253955,
        description: `<@${message.author.id}> has cleared the group shout.`,
        author: {
            name: message.author.tag,
            icon_url: message.author.displayAvatarURL
        },
        footer: {
            text: 'Action Logs'
        },
        timestamp: new Date()
    }});
    }

    if(command === 'currentshout'){
        rbx.getShout(config.groupId).then(shout => {
           message.channel.send({embed: {
               color: 11253955,
               description: `**Posted by ${shout.poster.username}**\n${shout.body}`,
               author: {
                   name: message.author.tag,
                   icon_url: message.author.displayAvatarURL
               },
               thumbnail: {
                   url: `http://www.roblox.com/Thumbs/Avatar.ashx?x=150&y=150&Format=Png&username=${shout.poster.username}`
               }
           }});
        });
    }
    
// Start of extra commands.



// End of commands.
});

client.login(config.token);
